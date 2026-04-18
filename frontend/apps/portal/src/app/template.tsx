'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function Template({ children }: { children: React.ReactNode }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Fade and slide up animation applied to the page content upon mounting
      gsap.from(container.current, {
        y: 15,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        clearProps: 'opacity,transform', // Cleans up animation inline styles only
      });
    },
    { scope: container }
  );

  return <div ref={container}>{children}</div>;
}
