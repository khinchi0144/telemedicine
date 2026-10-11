'use client';

import * as React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

/**
 * Motion primitives.
 *
 * Every animation in MediCare goes through this module so timing, easing and
 * the reduced-motion fallback stay consistent. `useReducedMotion()` collapses
 * movement to opacity-only for users who ask for less motion.
 */

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};

/* -------------------------------------------------------------------------- */
/*  Scroll reveal                                                              */
/* -------------------------------------------------------------------------- */

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before revealing. */
  delay?: number;
  y?: number;
  once?: boolean;
  as?: 'div' | 'section' | 'li' | 'article' | 'span' | 'header';
}

/** Reveals children when scrolled into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  once = true,
  as = 'div',
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration: 0.65, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </MotionTag>
  );
}

/* -------------------------------------------------------------------------- */
/*  3D tilt card                                                               */
/* -------------------------------------------------------------------------- */

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees. */
  intensity?: number;
}

/** Pointer-driven 3D tilt with a soft teal glow. Disabled for reduced motion. */
export function TiltCard({ children, className, intensity = 7 }: TiltCardProps) {
  const reduce = useReducedMotion();
  const [tilt, setTilt] = React.useState({ x: 0, y: 0, glowX: 50, glowY: 50 });

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={cn('group relative preserve-3d', className)}
      onPointerMove={(event) => {
        if (event.pointerType === 'touch') return;
        const rect = event.currentTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        setTilt({
          x: (0.5 - py) * intensity * 2,
          y: (px - 0.5) * intensity * 2,
          glowX: px * 100,
          glowY: py * 100,
        });
      }}
      onPointerLeave={() => setTilt({ x: 0, y: 0, glowX: 50, glowY: 50 })}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.6 }}
      style={{ transformPerspective: 1000 }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(420px circle at ${tilt.glowX}% ${tilt.glowY}%, rgba(0,140,135,0.13), transparent 62%)`,
        }}
      />
      <div className="preserve-3d relative">{children}</div>
    </motion.div>
  );
}
/* -------------------------------------------------------------------------- */
/*  Animated number                                                            */
/* -------------------------------------------------------------------------- */

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

/** Counts up when scrolled into view; shows the final value instantly when
 *  reduced motion is requested. */
export function CountUp({
  value,
  duration = 1.4,
  className,
  suffix = '',
  prefix = '',
}: CountUpProps) {
  const reduce = useReducedMotion();
  // `null` means "not started yet" — derived to `value` when motion is reduced,
  // so no state update is needed inside the effect.
  const [count, setCount] = React.useState<number | null>(null);
  const display = reduce ? value : (count ?? 0);
  const ref = React.useRef<HTMLSpanElement>(null);
  const started = React.useRef(false);

  React.useEffect(() => {
    if (reduce) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || started.current) return;
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / (duration * 1000));
          const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          setCount(Math.round(value * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Floating wrapper (decorative medical objects)                              */
/* -------------------------------------------------------------------------- */

/** Gentle, continuous float. Purely decorative and hidden from AT. */
export function Float({
  children,
  className,
  duration = 7,
  distance = 18,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      animate={{ y: [-distance / 2, distance / 2, -distance / 2] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
      aria-hidden="true"
    >
      {children}
    </motion.div>
  );
}