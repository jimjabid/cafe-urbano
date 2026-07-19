// The one island on the page: the whole menu experience needs shared state
// (sticky filter scrollspy + accordion). Data arrives as build-time props —
// the island fetches nothing.
import { useEffect, useRef, useState } from 'react';

export interface Category {
  id: string;
  title: string;
  dot: string;
  placeholder: string;
  note?: string;
}

export interface Dish {
  slug: string;
  name: string;
  variant?: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
}

export interface Promo {
  id: string;
  text: string;
  afterCategory: string;
}

interface Props {
  categories: Category[];
  dishes: Dish[];
  promos: Promo[];
  placeholders: Record<string, string>;
}

const dotStyle = (dot: string) => ({ backgroundColor: `var(--color-dot-${dot})` });

export default function MenuBoard({ categories, dishes, promos, placeholders }: Props) {
  const [active, setActive] = useState<string>(categories[0]?.id ?? '');
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // Suspends the scrollspy while a pill-click scroll is in flight
  const clickScroll = useRef(false);

  // Scrollspy — active pill tracks the category section in view
  useEffect(() => {
    const sections = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-menu-section]') ?? []);
    const observer = new IntersectionObserver(
      (entries) => {
        if (clickScroll.current) return;
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -65% 0px' }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Keep the active pill in view inside the horizontal bar
  useEffect(() => {
    navRef.current
      ?.querySelector<HTMLElement>(`[data-pill="${active}"]`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [active]);

  // Promo banners: GSAP border-pulse on scroll into view. Runs inside the island
  // after mount (never animate island internals from outside), reduced-motion safe.
  // Dynamic import: gsap is client-only — its CJS build breaks Astro's SSR pass.
  useEffect(() => {
    let mm: gsap.MatchMedia | undefined;
    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const triggers: ScrollTrigger[] = [];
        // Pulse color comes from the theme token — no raw hex in components
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
        gsap.utils.toArray<HTMLElement>('[data-promo]').forEach((el) => {
          const entrance = gsap.from(el, {
            opacity: 0,
            scale: 0.95,
            duration: 0.5,
            ease: 'power2.out',
            clearProps: 'all',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          });
          const pulse = gsap.fromTo(
            el,
            { boxShadow: `0 0 0 0 ${accent}` },
            {
              boxShadow: '0 0 0 12px transparent',
              duration: 1.2,
              repeat: 2,
              ease: 'power1.out',
              scrollTrigger: { trigger: el, start: 'top 85%', once: true },
            }
          );
          if (entrance.scrollTrigger) triggers.push(entrance.scrollTrigger);
          if (pulse.scrollTrigger) triggers.push(pulse.scrollTrigger);
        });
        return () => triggers.forEach((t) => t.kill());
      });
    })();
    return () => {
      cancelled = true;
      mm?.revert();
    };
  }, []);

  const jumpTo = (id: string) => {
    setActive(id);
    clickScroll.current = true;
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
    window.setTimeout(() => (clickScroll.current = false), 900);
  };

  return (
    <div ref={rootRef}>
      {/* Sticky horizontal category filter */}
      <div className="sticky top-0 z-40 border-b border-surface-subtle bg-surface/95 backdrop-blur">
        <div className="relative mx-auto max-w-2xl">
          <div
            ref={navRef}
            className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3"
            role="tablist"
            aria-label="Categorías del menú"
          >
            {categories.map((c) => (
              <button
                key={c.id}
                data-pill={c.id}
                role="tab"
                aria-selected={active === c.id}
                onClick={() => jumpTo(c.id)}
                className={
                  'flex shrink-0 items-center gap-2 rounded-pill border px-4 py-1.5 text-sm transition-colors ' +
                  (active === c.id
                    ? 'border-ink bg-ink font-medium text-surface'
                    : 'border-ink/25 bg-surface text-ink')
                }
              >
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={dotStyle(c.dot)} />
                {c.title}
              </button>
            ))}
          </div>
          {/* Scroll cue: right-edge fade */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent"
          />
        </div>
      </div>

      {/* Category sections */}
      <div className="mx-auto max-w-2xl px-5 pb-16">
        {categories.map((cat) => {
          const items = dishes.filter((d) => d.category === cat.id);
          const promo = promos.find((p) => p.afterCategory === cat.id);
          return (
            <div key={cat.id}>
              <section id={cat.id} data-menu-section className="scroll-mt-20 pt-10">
                <h2 className="flex items-center gap-3 text-2xl font-bold uppercase tracking-wide">
                  {cat.title}
                  <span aria-hidden="true" className="h-4 w-4 rounded-full" style={dotStyle(cat.dot)} />
                </h2>
                {cat.note && <p className="mt-2 text-sm italic text-ink-soft">{cat.note}</p>}

                <ul className="mt-4 divide-y divide-surface-subtle">
                  {items.map((d) => {
                    const isExtra = d.variant === 'extra';
                    const expandable = !isExtra && Boolean(d.description || d.image);
                    const isOpen = open === d.slug;
                    return (
                      <li key={d.slug}>
                        {expandable ? (
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => setOpen(isOpen ? null : d.slug)}
                            className={
                              'flex w-full items-center justify-between gap-4 rounded-lg px-2 py-3 text-left transition-colors ' +
                              (isOpen ? 'bg-surface-subtle' : 'hover:bg-surface-subtle/60')
                            }
                          >
                            <span className="min-w-0 font-medium">
                              {d.name}
                              {d.variant && (
                                <em className="ml-1.5 font-normal text-ink-soft"> {d.variant}</em>
                              )}
                            </span>
                            <span className="flex shrink-0 items-center gap-2.5 whitespace-nowrap font-medium">
                              {d.image && (
                                <img
                                  src={d.image}
                                  alt=""
                                  width={40}
                                  height={40}
                                  loading="lazy"
                                  className="h-10 w-10 rounded-lg object-cover"
                                />
                              )}
                              {d.price}
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 16 16"
                                className={
                                  'h-3 w-3 text-ink-soft transition-transform motion-reduce:transition-none ' +
                                  (isOpen ? 'rotate-180' : '')
                                }
                              >
                                <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          </button>
                        ) : (
                          <div
                            className={
                              'flex items-baseline justify-between gap-4 px-2 ' +
                              (isExtra ? 'py-2 text-sm text-ink-soft' : 'py-3')
                            }
                          >
                            <span className={isExtra ? '' : 'font-medium'}>
                              {isExtra ? `• ${d.name}` : d.name}
                              {d.variant && !isExtra && (
                                <em className="ml-1.5 font-normal text-ink-soft"> {d.variant}</em>
                              )}
                            </span>
                            <span className="whitespace-nowrap font-medium">
                              {isExtra ? `+${d.price}` : d.price}
                            </span>
                          </div>
                        )}

                        {/* Expanded panel — CSS grid-rows transition, reduced-motion exempt */}
                        {expandable && (
                          <div
                            className={
                              'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ' +
                              (isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')
                            }
                          >
                            <div className="overflow-hidden">
                              <div className="relative mx-2 mb-3 rounded-card bg-surface-subtle p-4">
                                <button
                                  type="button"
                                  aria-label="Cerrar"
                                  onClick={() => setOpen(null)}
                                  className="absolute right-3 top-3 text-xl leading-none text-ink-soft"
                                >
                                  ×
                                </button>
                                {d.image ? (
                                  <img
                                    src={d.image}
                                    alt={d.name}
                                    loading="lazy"
                                    className="mx-auto aspect-[4/3] w-full max-w-sm rounded-lg object-cover"
                                  />
                                ) : (
                                  <img
                                    src={placeholders[cat.placeholder]}
                                    alt=""
                                    loading="lazy"
                                    className="mx-auto h-20 w-20 opacity-70"
                                  />
                                )}
                                {d.description && (
                                  <p className="mt-3 pr-6 text-sm text-ink-soft">{d.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                  {items.length === 0 && cat.note && (
                    <li className="px-2 py-3 text-sm text-ink-soft">{/* counter-only category — note above is the content */}</li>
                  )}
                </ul>
              </section>

              {promo && (
                <aside
                  data-promo
                  className="mt-6 rounded-card border-2 border-accent px-5 py-4 text-center text-sm font-medium md:text-base"
                >
                  {promo.text}
                </aside>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
