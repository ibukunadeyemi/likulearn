/** Presentation helpers shared by the page components. */

export type RichPart = { text: string; accent: boolean } | { br: true };

/**
 * Editors mark words with *asterisks* to colour them and use new lines for line breaks,
 * e.g. "Start *Learning* in 3 Simple Steps".
 */
export function richParts(value: string | null | undefined): RichPart[] {
  const parts: RichPart[] = [];
  (value ?? '').split(/\r?\n/).forEach((line, i) => {
    if (i > 0) parts.push({ br: true });
    line.split(/(\*[^*]+\*)/).forEach((chunk) => {
      if (!chunk) return;
      const accent = chunk.length > 2 && chunk.startsWith('*') && chunk.endsWith('*');
      parts.push({ text: accent ? chunk.slice(1, -1) : chunk, accent });
    });
  });
  return parts;
}

/** Benefit icon choices (the "Icon" select in the admin). */
export const BENEFIT_ICONS: Record<string, string> = {
  graduation: 'M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5',
  award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 22l5-3 5 3-1.2-8.1',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  flask: 'M10 2v7.31L4 20h16l-6-10.69V2M8.5 2h7M7 16h10',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1',
  family: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
};

export const BENEFIT_COLORS: Record<string, string> = {
  orange: '#FF7A1A',
  amber: '#F59E4C',
  blue: '#2F6FE4',
  green: '#22B55B',
  lime: '#A3C51C',
  red: '#EE5A24',
};

/** wa.me link from a number typed any way (spaces, +, dashes). */
export function whatsappHref(number: string | null | undefined) {
  const digits = (number ?? '').replace(/\D/g, '');
  return digits.length >= 7 ? `https://wa.me/${digits}` : null;
}
