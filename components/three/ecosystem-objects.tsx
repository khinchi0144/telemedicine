'use client';

import * as React from 'react';
import { useSyncExternalStore } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export const SCENE_TEAL = '#16a69a';
export const SCENE_TEAL_DEEP = '#087f8c';
export const SCENE_NAVY = '#142b3b';
export const SCENE_MINT = '#e9f7f5';

/** WebGL support never changes at runtime, so the store has no subscribers. */
function subscribeNoop() {
  return () => {};
}

let webglSupport: boolean | null = null;

function getWebGLSupport(): boolean {
  if (webglSupport !== null) return webglSupport;

  let detected = false;
  try {
    const canvas = document.createElement('canvas');
    detected = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    detected = false;
  }

  webglSupport = detected;
  return detected;
}

/**
 * Reads WebGL support without an effect, so the very first client render
 * already knows whether to mount the canvas. `getServerSnapshot` returns true
 * so the server renders the same markup shape as a WebGL-capable client.
 */
export function useWebGLStore(): boolean {
  return useSyncExternalStore(subscribeNoop, getWebGLSupport, () => true);
}

/** A softly spinning capsule — reads as a medical capsule. */
export function Capsule({
  color = SCENE_TEAL,
  position,
  scale = 1,
}: {
  color?: string;
  position: [number, number, number];
  scale?: number;
}) {
  const mesh = React.useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    mesh.current.rotation.y = t * 0.4;
    mesh.current.rotation.x = Math.sin(t * 0.5) * 0.16;
  });

  return (
    <mesh ref={mesh} position={position} scale={scale}>
      <capsuleGeometry args={[0.3, 0.8, 16, 32]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.22}
        metalness={0.05}
        clearcoat={0.7}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}

/** Flattened medical cross with a bevelled, glassy finish. */
export function Cross({
  position,
  color = SCENE_MINT,
  scale = 1,
}: {
  position: [number, number, number];
  color?: string;
  scale?: number;
}) {
  const group = React.useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = t * 0.32;
    group.current.rotation.z = Math.sin(t * 0.45) * 0.18;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <RoundedBox args={[1.5, 0.46, 0.3]} radius={0.14} smoothness={4}>
        <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={0.8} />
      </RoundedBox>
      <RoundedBox args={[0.46, 1.5, 0.3]} radius={0.14} smoothness={4}>
        <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={0.8} />
      </RoundedBox>
    </group>
  );
}

/** Rounded card standing in for a patient health record / monitor. */
export function RecordPanel({ position }: { position: [number, number, number] }) {
  const mesh = React.useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = -0.4 + Math.sin(state.clock.elapsedTime * 0.3) * 0.18;
  });

  return (
    <mesh ref={mesh} position={position}>
      <boxGeometry args={[1.5, 1.9, 0.14]} />
      <meshPhysicalMaterial
        color={SCENE_NAVY}
        roughness={0.3}
        metalness={0.15}
        clearcoat={0.5}
      />
    </mesh>
  );
}