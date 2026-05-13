'use client';

import * as React from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { motion } from 'motion/react';

import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function MarketingHero() {
  const heroRef = React.useRef<HTMLElement>(null);
  const bgRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!bgRef.current) return;
      gsap.to(bgRef.current, {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    },
    { scope: heroRef }
  );

  return (
    <section
      ref={heroRef}
      className="relative isolate overflow-hidden border-b border-border-subtle"
    >
      {/* Background — parallaxed via GSAP ScrollTrigger. */}
      <div
        ref={bgRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(190,252,66,0.15) 0px, transparent 38%), radial-gradient(circle at 80% 70%, rgba(190,252,66,0.07) 0px, transparent 45%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-28 md:py-36">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOutExpo }}
          className="text-caption uppercase text-tertiary"
        >
          Brokered marketplace · Armenia
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.1 }}
          className="text-display-xl tracking-tight text-primary"
        >
          Find your next ad slot.
          <br />
          We handle the rest<span className="text-accent">.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.25 }}
          className="max-w-xl text-body-lg text-secondary"
        >
          Browse TV, radio, outdoor, video, and product-placement inventory
          across the country. Submit an inquiry and our team brokers the rest —
          you never juggle a publisher inbox.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.4 }}
          className="flex flex-wrap items-center gap-3"
        >
          <Button asChild size="lg">
            <Link href="/register">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/how-it-works/advertisers">How it works</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
