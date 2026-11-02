import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(useGSAP);
export function useMotion(scope: RefObject<HTMLElement | null>, key: string) {
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const stamp = scope.current?.querySelector('.outcome');
      if (key !== 'initial' && stamp) gsap.from(stamp, { scale: 1.045, y: -5, opacity: 0.4, duration: 0.32, ease: 'power2.out', clearProps: 'transform,opacity' });
      const nodes = scope.current?.querySelectorAll(key === 'initial' ? '.destination-option' : '.alert');
      if (nodes?.length) gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.3 } }).from(nodes, { y: key === 'initial' ? 12 : 8, opacity: 0, stagger: key === 'initial' ? 0.06 : 0.04, clearProps: 'transform,opacity' });
    });
    return () => media.revert();
  }, { scope, dependencies: [key], revertOnUpdate: true });
}
