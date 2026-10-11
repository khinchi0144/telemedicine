'use client';

import * as React from 'react';
import { useSyncExternalStore } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

import { useReducedMotion } from 'framer-motion';

/**
 * Interactive healthcare hero scene.
 *
 * Built entirely from primitives — no external model to download, so it is
 * fast and always sharp. The whole canvas is:
 *   • lazily mounted (only on the landing page)
 *   • disabled for users who prefer reduced motion
 *   • replaced by a static CSS composition when WebGL is unavailable
 */

/** WebGL support never changes at runtime, so the store has no subscribers. */
function subscribeNoop() {
  return () => {};
}

let webglSupport: boolean | null = null;

function getWebGLSupport(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement('canvas');
    webglSupport = Boolean(
      canvas.getContext('webgl2') ?? canvas.getContext('webgl'),
    );
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

function Pill({ color = '#008c87', position, scale = 1 }: {
  color?: string;
  position: [number, number, number];
  scale?: number;
}) {
  const mesh = React.useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.35;
    mesh.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6) * 0.12;
  });
  return (
    <mesh ref={mesh} position={position} scale={scale}>
      <capsuleGeometry args={[0.34, 0.9, 16, 32]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.25}
        metalness={0.08}
        clearcoat={0.6}
      />
    </mesh>
  );
}

function Shield() {
  const group = React.useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = -state.clock.elapsedTime * 0.22;
  });
  return (
    <group ref={group} position={[0, 0.15, 0]} rotation={[0.12, 0, 0]}>
      <RoundedBox args={[2.3, 2.3, 0.36]} radius={0.34} smoothness={5}>
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.32}
          metalness={0.06}
          clearcoat={0.5}
        />
      </RoundedBox>
      {/* cross */}
      <mesh position={[0, 0.15, 0.22]}>
        <boxGeometry args={[1.15, 0.3, 0.08]} />
        <meshPhysicalMaterial color="#008c87" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.15, 0.22]}>
        <boxGeometry args={[0.3, 1.15, 0.08]} />
        <meshPhysicalMaterial color="#008c87" roughness={0.4} />
      </mesh>
    </group>
  );
}

function HeartBeat() {
  const mesh = React.useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    // heartbeat scale
    const beat = 1 + Math.sin(t * 2.4) * 0.03 + Math.sin(t * 2.4 * 2) * 0.018;
    mesh.current.scale.setScalar(beat);
  });
  return (
    <mesh ref={mesh} position={[0, -1.55, 0.35]} rotation={[-0.28, 0, 0]}>
      <torusGeometry args={[0.62, 0.13, 20, 64]} />
      <meshPhysicalMaterial
        color="#40bfb6"
        roughness={0.3}
        metalness={0.1}
        clearcoat={0.8}
      />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} />
      <directionalLight position={[-5, 2, -4]} intensity={0.45} color="#aeeae3" />
      <pointLight position={[0, 0, 3]} intensity={0.6} color="#7bd9d0" />

      <Float speed={1.6} rotationIntensity={0.28} floatIntensity={0.55}>
        <Shield />
      </Float>

      <Float speed={2.1} floatIntensity={0.9} rotationIntensity={0.5}>
        <Pill color="#17a49b" position={[2.25, 0.75, -0.5]} scale={0.92} />
      </Float>
      <Float speed={1.8} floatIntensity={1.1} rotationIntensity={0.45}>
        <Pill color="#94aecb" position={[-2.35, 0.35, -0.2]} scale={0.78} />
      </Float>
      <Float speed={2.4} floatIntensity={0.8} rotationIntensity={0.6}>
        <Pill color="#40bfb6" position={[1.85, -1.15, -1]} scale={0.62} />
      </Float>
      <Float speed={2} floatIntensity={0.7} rotationIntensity={0.4}>
        <Pill color="#e9f7f5" position={[-1.9, -1.35, -0.9]} scale={0.7} />
      </Float>

      <HeartBeat />

      <ContactShadows
        position={[0, -2.2, 0]}
        opacity={0.28}
        scale={11}
        blur={2.6}
        far={5}
        color="#102a43"
      />

      {/*
        Local three-point lighting instead of `<Environment preset="city" />`,
        which downloads a multi-megabyte HDRI from a CDN. Nothing leaves the
        machine and the scene renders on the first frame.
      */}
      <ambientLight intensity={0.65} color="#e6f4ff" />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, 2, -3]} intensity={0.7} color="#7fd4cf" />
      <pointLight position={[0, 1.5, 3]} intensity={0.6} color="#008c87" />
    </>
  );
}

/** Static, non-WebGL fallback so the hero never renders empty. */
function SceneFallback() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 size-52 -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] border border-teal-200 bg-card shadow-[0_30px_70px_-30px_rgba(0,140,135,0.55)] sm:size-64">
        <div className="absolute left-1/2 top-1/2 h-12 w-24 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-teal-600" />
        <div className="absolute left-1/2 top-1/2 h-24 w-12 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-teal-600" />
      </div>
      <span className="absolute left-[12%] top-[28%] size-12 rounded-full bg-teal-300/70 blur-[1px]" />
      <span className="absolute right-[10%] top-[22%] size-8 rounded-full bg-navy-200" />
      <span className="absolute bottom-[24%] left-[20%] size-9 rounded-full bg-mint-200" />
      <span className="absolute bottom-[18%] right-[22%] size-6 rounded-full bg-teal-400/60" />
    </div>
  );
}

export default function HeroScene() {
  const reduce = useReducedMotion();
  // `useSyncExternalStore` reads the browser capability without an effect, so
  // the very first client render already knows whether to mount WebGL.
  const supported = useSyncExternalStore(subscribeNoop, getWebGLSupport, () => true);

  if (reduce || !supported) {
    return <SceneFallback />;
  }

  return (
    <Canvas
      camera={{ position: [0, 0.35, 7.2], fov: 42 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <Scene />
    </Canvas>
  );
}