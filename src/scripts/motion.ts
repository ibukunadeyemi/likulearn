import { animate, inView, scroll, stagger } from 'motion';

export { animate, scroll, stagger };

/** Set before first paint by the layout, unless the visitor asked for reduced motion. */
export const motionOn = () => document.documentElement.classList.contains('js-motion');

/** Same curve as --ease-out in global.css, for tweens that should match the CSS ones. */
export const easeOut = [0.22, 1, 0.36, 1] as const;

/** Soft spring for things settling into place: barely any overshoot. */
export const settle = { type: 'spring', visualDuration: 0.7, bounce: 0.12 } as const;

/** Snappier spring for UI responding to a click. */
export const snap = { type: 'spring', visualDuration: 0.35, bounce: 0.18 } as const;

/** [from, to] transforms per data-reveal value. Whole transform strings (not x/y shorthands) let
 *  the browser run the spring on the compositor, so it stays smooth even while the page is busy.
 *  The end is an explicit identity because Motion reads 'none' as scale(0). */
const REVEAL: Record<string, [string, string]> = {
  '': ['translateY(22px)', 'translateY(0px)'],
  left: ['translateX(-28px)', 'translateX(0px)'],
  right: ['translateX(28px)', 'translateX(0px)'],
  zoom: ['scale(0.94)', 'scale(1)'],
};

/**
 * Scroll reveal for [data-reveal] blocks. CSS hides them until this runs; Motion then springs
 * each one into place. Blocks entering the viewport together are staggered in DOM order.
 */
export function initReveal() {
  if (!motionOn()) return;
  let batch: HTMLElement[] = [];

  const flush = () => {
    const els = batch;
    batch = [];
    els.forEach((el, i) => {
      const transform = REVEAL[el.dataset.reveal ?? ''] ?? REVEAL[''];
      const delay = Math.min(i, 7) * 0.07;
      // Starts the .highlight sweep in Rich.astro headings.
      el.classList.add('is-visible');
      animate(el, { opacity: [0, 1], transform }, {
        ...settle,
        delay,
        opacity: { duration: 0.6, ease: easeOut, delay },
      }).then(() => {
        // Hand the element back to its own CSS so hover transforms work again.
        el.removeAttribute('data-reveal');
        el.classList.remove('is-visible');
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
      });
    });
  };

  inView('[data-reveal]', (el) => {
    if (!batch.length) queueMicrotask(flush);
    batch.push(el as HTMLElement);
  }, { margin: '0px 0px -8% 0px', amount: 0.08 });
}
