'use client';

import * as React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';

import { useReducedMotion } from 'framer-motion';

import {
  Capsule,
  Cross,
  RecordPanel,
  SCENE_NAVY,
  SCENE_TEAL,
  SCENE_TEAL_DEEP,
  useWebGLStore,
} from './ecosystem-objects';

/**
 * Healthcare ecosystem scene for the registration screen.
 *
 * Every object is built from primitives, so there is no model to download and
 * the canvas renders on the first frame. The scene is code-split by the parent
 * and replaced by a pure-CSS composition when WebGL is unavailable or the user
 * prefers reduced motion.
 */

/** Animated pulse ring — the ECG heartbeat. */
function PulseRing({
  position,
  color = SCENE_TEAL_DEEP,
  radius = 1.15,
}: {
  position: [number, number, number];
  color?: string;
  radius?: number;
}) {
  const mesh = React.useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime % 2.4;
    mesh.current.scale.setScalar(1 + t * 0.55);
    (mesh.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
      0,
      0.45 * (1 - t / 2.4),
    );
  });

  return (
    <mesh ref={mesh} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.028, 16, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </mesh>
  );
}

/** The floating healthcare objects that make up the ecosystem. */
function SceneContents({ reduce }: { reduce: boolean }) {
  return (
    <>
      <Float speed={reduce ? 0 : 1.6} floatIntensity={0.5} rotationIntensity={0.3}>
        <PulseRing position={[0, -1.5, 0]} />
        <PulseRing position={[0, -1.5, 0]} radius={0.75} />
      </Float>

      <Float speed={reduce ? 0 : 1.3} floatIntensity={0.9}>
        <Capsule position={[-1.55, 0.85, 0.35]} scale={0.85} color={SCENE_TEAL} />
      </Float>
      <Float speed={reduce ? 0 : 1.7} floatIntensity={1.1} rotationIntensity={0.6}>
        <Capsule position={[1.65, 0.6, -0.3]} scale={0.6} />
      </Float>
      <Float speed={reduce ? 0 : 1.4} floatIntensity={0.8}>
        <Cross position={[-1.2, -1.1, -0.4]} scale={0.7} />
      </Float>
      <Float speed={reduce ? 0 : 1.2} floatIntensity={0.6}>
        <RecordPanel position={[1.5, -0.85, 0.2]} />
      </Float>

      {/* Local three-point lighting — no remote HDRI to download. */}
      <ambientLight intensity={0.7} color="#e6f4ff" />
      <directionalLight position={[4, 6, 5]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-5, 2, -3]} intensity={0.8} color={SCENE_TEAL} />
      <pointLight position={[0, 1.5, 3]} intensity={0.7} color={SCENE_TEAL_DEEP} />

      <ContactShadows
        position={[0, -2.4, 0]}
        opacity={0.3}
        scale={12}
        blur={2.6}
        far={5}
        color={SCENE_NAVY}
      />
    </>
  );
}

export default function EcosystemScene() {
  // `useReducedMotion()` returns `boolean | null`; treat null as "no preference".
  const reduce = Boolean(useReducedMotion());
  const supported = useWebGLStore();

  if (reduce || !supported) return <EcosystemFallback />;

  return (
    <Canvas
      camera={{ position: [0, 0.2, 7.4], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <SceneContents reduce={reduce} />
    </Canvas>
  );
}

/**
 * Pure-CSS fallback: layered translucent rings and pills.
 * Guarantees the right-hand column never renders as an empty box.
 */
export function EcosystemFallback() {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      aria-hidden="true"
    >
      <span className="absolute size-[22rem] rounded-full border border-teal-200/60" />
      <span className="absolute size-[17rem] rounded-full border border-teal-300/50" />
      <span className="absolute size-[24rem] rounded-full border border-navy-200/40" />

      <span className="teal-glow absolute size-40 rounded-full opacity-70" />
      <span className="relative flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 shadow-[0_24px_60px_-20px_rgba(8,127,140,0.8)]">
        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.5),transparent_62%)]" />
      </span>

      <span className="absolute left-[12%] top-[22%] h-6 w-16 rotate-12 rounded-full bg-gradient-to-r from-teal-400/80 to-teal-600/80" />
      <span className="absolute right-[10%] top-[30%] h-4 w-12 -rotate-12 rounded-full bg-gradient-to-r from-mint-200 to-teal-300/80" />
      <span className="absolute bottom-[20%] left-[18%] h-4 w-14 rotate-45 rounded-full bg-navy-500/40" />
    </div>
  );
}