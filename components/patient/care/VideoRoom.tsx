'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { formatDateTime } from '@/lib/utils/format';
import { apiRequest } from '@/lib/utils/api-client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Volume2, Video, PhoneOff } from 'lucide-react';

import type { ConsultationSignalRecord } from '@/lib/db/types';

interface VideoRoomProps {
  appointmentId: string;
  currentUserId: string;
  otherPartyName: string;
  isInitiator: boolean;
  status: string;
  whenLabel: string;
  /** Server-resolved lobby link for the viewer's role (patient vs doctor). */
  backHref: string;
}

type Phase = 'idle' | 'joining' | 'joined';

interface SignalEnvelope {
  kind: 'join' | 'offer' | 'answer' | 'ice';
  from: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

interface PollResponse {
  signals: ConsultationSignalRecord[];
  now: string;
}

function parseEnvelope(raw: string): SignalEnvelope | null {
  try {
    const parsed = JSON.parse(raw) as SignalEnvelope;
    if (!parsed || typeof parsed.kind !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function VideoRoom({
  appointmentId,
  currentUserId,
  otherPartyName,
  isInitiator,
  status,
  whenLabel,
  backHref,
}: VideoRoomProps) {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(null);
  const [remotePresent, setRemotePresent] = React.useState(false);
  const [localMuted, setLocalMuted] = React.useState(false);
  const [localVideoOn, setLocalVideoOn] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [leaveReason, setLeaveReason] = React.useState<string | null>(null);

  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const localRef = React.useRef<HTMLVideoElement | null>(null);
  const remoteRef = React.useRef<HTMLVideoElement | null>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const pollTimerRef = React.useRef<number | undefined>(undefined);
  const sinceRef = React.useRef<string>(new Date(0).toISOString());
  const seenIdsRef = React.useRef<Set<string>>(new Set());
  const pendingIceRef = React.useRef<RTCIceCandidateInit[]>([]);
  const stoppingRef = React.useRef(false);
  const signalsUrl = `/api/consultations/${appointmentId}/signals`;
  const postEnvelope = React.useCallback(
    async (envelope: SignalEnvelope) => {
      await apiRequest(signalsUrl, {
        method: 'POST',
        body: { payload: JSON.stringify(envelope) },
      });
    },
    [signalsUrl],
  );

  const teardown = React.useCallback(() => {
    stoppingRef.current = true;
    if (pollTimerRef.current !== undefined) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = undefined;
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {
        // Closing twice is harmless.
      }
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  React.useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  React.useEffect(() => {
    if (localRef.current) localRef.current.srcObject = localStream;
  }, [localStream]);

  const flushPendingIce = React.useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription || pendingIceRef.current.length === 0) return;
    const queued = pendingIceRef.current.splice(0, pendingIceRef.current.length);
    for (const init of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(init));
      } catch {
        // Stale candidate; ignore.
      }
    }
  }, []);

  const createPeerConnection = React.useCallback(
    (stream: MediaStream) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pc.ontrack = (event) => {
        const incoming = event.streams?.[0];
        if (remoteRef.current && incoming) {
          remoteRef.current.srcObject = incoming;
          setRemotePresent(true);
        }
      };
      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        const candidate = event.candidate.toJSON() as RTCIceCandidateInit;
        void postEnvelope({ kind: 'ice', from: currentUserId, candidate }).catch(
          () => undefined,
        );
      };
      pc.onconnectionstatechange = () => {
        if (stoppingRef.current) return;
        if (pc.connectionState === 'connected') setPhase('joined');
        else if (pc.connectionState === 'failed') setRemotePresent(false);
      };
      return pc;
    },
    [currentUserId, postEnvelope],
  );

  const handleEnvelope = React.useCallback(
    async (envelope: SignalEnvelope) => {
      const pc = pcRef.current;
      if (!pc || stoppingRef.current) return;
      if (envelope.from === currentUserId) return;
      if (envelope.kind === 'offer' && envelope.sdp) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(envelope.sdp));
          await flushPendingIce();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await postEnvelope({
            kind: 'answer',
            from: currentUserId,
            sdp: pc.localDescription?.toJSON(),
          });
          setPhase('joined');
        } catch {
          setError('The connection offer could not be answered. Please rejoin.');
        }
        return;
      }
      if (envelope.kind === 'answer' && envelope.sdp) {
        try {
          if (!pc.remoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(envelope.sdp));
            await flushPendingIce();
          }
          setPhase('joined');
        } catch {
          setError('The connection answer could not be applied. Please rejoin.');
        }
        return;
      }
      if (envelope.kind === 'ice' && envelope.candidate) {
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(envelope.candidate));
          } catch {
            // Ignore stale candidates.
          }
        } else {
          pendingIceRef.current.push(envelope.candidate);
        }
      }
    },
    [currentUserId, flushPendingIce, postEnvelope],
  );

  const pollOnce = React.useCallback(async () => {
    let result: PollResponse;
    try {
      result = await apiRequest<PollResponse>(
        `${signalsUrl}?since=${encodeURIComponent(sinceRef.current)}`,
        { method: 'GET', csrf: false },
      );
    } catch {
      return;
    }
    sinceRef.current = result.now ?? new Date().toISOString();
    for (const signal of result.signals ?? []) {
      if (!signal || seenIdsRef.current.has(signal.id)) continue;
      seenIdsRef.current.add(signal.id);
      if (signal.senderUserId === currentUserId) continue;
      const envelope = parseEnvelope(signal.payload);
      if (!envelope) continue;
      await handleEnvelope(envelope);
    }
  }, [currentUserId, handleEnvelope, signalsUrl]);

  const startPolling = React.useCallback(() => {
    if (pollTimerRef.current !== undefined) return;
    void pollOnce();
    pollTimerRef.current = window.setInterval(() => {
      void pollOnce();
    }, 2500);
  }, [pollOnce]);

  const join = React.useCallback(async () => {
    if (phase === 'joining' || phase === 'joined') return;
    setError(null);
    setLeaveReason(null);
    setPhase('joining');
    stoppingRef.current = false;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to access camera/audio.');
      setPhase('idle');
      return;
    }
    localStreamRef.current = stream;
    setLocalStream(stream);
    const audioTrack = stream.getAudioTracks()[0];
    setLocalMuted(audioTrack ? !audioTrack.enabled : false);
    const videoTrack = stream.getVideoTracks()[0];
    setLocalVideoOn(videoTrack ? videoTrack.enabled : true);
    const pc = createPeerConnection(stream);
    sinceRef.current = new Date().toISOString();
    try {
      await postEnvelope({ kind: 'join', from: currentUserId });
    } catch {
      // Join marker is advisory only.
    }
    startPolling();
    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await postEnvelope({
          kind: 'offer',
          from: currentUserId,
          sdp: pc.localDescription?.toJSON(),
        });
      } catch {
        setError('The room could not create an offer. Please try again.');
        setPhase('idle');
      }
    }
  }, [createPeerConnection, currentUserId, isInitiator, phase, postEnvelope, startPolling]);

  const leave = React.useCallback(() => {
    teardown();
    stoppingRef.current = false;
    pendingIceRef.current = [];
    setPhase('idle');
    setRemotePresent(false);
    setLeaveReason('left the room');
    if (remoteRef.current) remoteRef.current.srcObject = null;
  }, [teardown]);

  const toggleLocalMute = React.useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setLocalMuted(!track.enabled);
    }
  }, []);

  const toggleLocalVideo = React.useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setLocalVideoOn(track.enabled);
    }
  }, []);

  if (status !== 'CONFIRMED') {
    return (
      <Card className='p-5'>
        <p className='font-display text-sm font-bold text-navy-900'>Room not ready yet</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          This room opens once the appointment is confirmed ({whenLabel} with{' '}
          {otherPartyName}).
        </p>
        <Button
          variant='outline'
          size='sm'
          className='mt-3'
          onClick={() => router.push(backHref)}
        >
          Back to consultations
        </Button>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <Card className='p-4 sm:p-5'>
        <div className='relative aspect-video overflow-hidden rounded-lg bg-muted'>
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className='size-full object-cover'
            aria-label={`${otherPartyName}'s camera`}
          />
          <div
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center gap-1 bg-muted',
              remotePresent ? 'pointer-events-none opacity-0' : 'opacity-100',
            )}
          >
            <Video className='size-8 text-muted-foreground' aria-hidden='true' />
            <p className='font-display text-sm font-medium text-navy-900'>
              Waiting for {otherPartyName} to join...
            </p>
            <p className='text-[12px] text-muted-foreground'>
              Checking the room every few seconds.
            </p>
          </div>
        </div>
        <div className='mt-3 grid gap-3 sm:grid-cols-[1fr_280px]'>
          <div className='relative aspect-video overflow-hidden rounded-lg bg-muted'>
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className='size-full object-cover'
              aria-label='Your camera preview'
            />
            {!localVideoOn && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='flex size-14 items-center justify-center rounded-full bg-black/40 text-white'>
                  <Video className='size-6' aria-hidden='true' />
                </span>
              </div>
            )}
          </div>
          <div className='flex flex-col gap-2'>
            <div className='flex gap-2'>
              <Button
                size='sm'
                variant={localMuted ? 'primary' : 'outline'}
                onClick={toggleLocalMute}
                disabled={!localStream}
              >
                <Volume2 className='size-4' aria-hidden='true' />
                {localMuted ? 'Unmute' : 'Mute'}
              </Button>
              <Button
                size='sm'
                variant={localVideoOn ? 'primary' : 'outline'}
                onClick={toggleLocalVideo}
                disabled={!localStream}
              >
                <Video className='size-4' aria-hidden='true' />
                {localVideoOn ? 'Stop camera' : 'Camera'}
              </Button>
            </div>
            {error && (
              <Alert variant='error' title='Something went wrong'>
                {error}
              </Alert>
            )}
            <div className='mt-auto flex gap-2'>
              {phase === 'idle' ? (
                <Button variant='primary' size='sm' onClick={join}>
                  Join the room
                </Button>
              ) : (
                <Button variant='destructive' size='sm' onClick={leave}>
                  <PhoneOff className='size-4' aria-hidden='true' />
                  {phase === 'joining' ? 'Cancel' : 'Leave'}
                </Button>
              )}
              <Button
                variant='ghost'
                size='sm'
                onClick={() => router.push(backHref)}
              >
                Back to consultations
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <p className='text-center text-[12px] text-muted-foreground'>
        {leaveReason
          ? `You left the room at ${formatDateTime(new Date())}.`
          : 'The room may be joined before the scheduled time.'}
      </p>
    </div>
  );
}

