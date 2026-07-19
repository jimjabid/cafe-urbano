/*
 * Motion entry point — GSAP timelines attach to [data-animate] hooks only.
 * Owned by gsap-motion-designer; astro-ui-architect places the hooks.
 *
 * Rules (see .claude/rules/code-review-checklist.md §GSAP):
 * - Everything runs inside gsap.matchMedia() so prefers-reduced-motion users
 *   get content in its final state — never stuck at opacity 0.
 * - Initial states are set from GSAP (gsap.set / from-vars), never in static CSS.
 * - Pure-Astro sections only. Island internals animate from inside the island after mount.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // Header entrance — logo + greeting bubble stagger
  const headerTargets = gsap.utils.toArray<HTMLElement>('[data-animate^="header-"]');
  if (headerTargets.length) {
    gsap.from(headerTargets, {
      opacity: 0,
      y: 32,
      duration: 0.7,
      ease: 'power2.out',
      stagger: 0.12,
    });
  }

  // Section reveals — one trigger per [data-animate-section], once only
  gsap.utils.toArray<HTMLElement>('[data-animate-section]').forEach((section) => {
    gsap.from(section, {
      opacity: 0,
      y: 40,
      duration: 0.6,
      ease: 'power2.out',
      // clearProps: a lingering transform makes the section a containing block for
      // position:fixed descendants (modals/lightboxes would render inside the section).
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: section, start: 'top 80%', once: true },
    });
  });

  return () => {
    ScrollTrigger.getAll().forEach((t) => t.kill());
  };
});
