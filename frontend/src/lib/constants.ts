// src/lib/constants.ts

/**
 * Subject seat coloring palette used across the SeatMap and RoomExplorer components.
 * Consists of 8 distinct visual themes for light and dark modes.
 */
export const SEAT_PALETTE = [
  { bg: 'bg-blue-100 dark:bg-blue-950/45', text: 'text-blue-900 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-800' },
  { bg: 'bg-emerald-100 dark:bg-emerald-950/45', text: 'text-emerald-900 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
  { bg: 'bg-amber-100 dark:bg-amber-950/45', text: 'text-amber-900 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' },
  { bg: 'bg-purple-100 dark:bg-purple-950/45', text: 'text-purple-900 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-800' },
  { bg: 'bg-rose-100 dark:bg-rose-950/45', text: 'text-rose-900 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-800' },
  { bg: 'bg-cyan-100 dark:bg-cyan-950/45', text: 'text-cyan-900 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-800' },
  { bg: 'bg-lime-100 dark:bg-lime-950/45', text: 'text-lime-900 dark:text-lime-300', border: 'border-lime-300 dark:border-lime-800' },
  { bg: 'bg-fuchsia-100 dark:bg-fuchsia-950/45', text: 'text-fuchsia-900 dark:text-fuchsia-300', border: 'border-fuchsia-300 dark:border-fuchsia-800' },
];

/**
 * Standard animation classes or durations
 */
export const ANIMATIONS = {
  pageEnter: 'animate-in fade-in slide-in-from-bottom-4 duration-300',
  fadeIn: 'animate-in fade-in duration-200',
  dropdownEnter: 'animate-in fade-in slide-in-from-top-2 duration-150',
};
