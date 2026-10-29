import type { CSSProperties } from "react";

const paths = {
  search: "m21 21-4.3-4.3M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z",
  cart: "M3 3h2l2.5 12h10.8L21 6H6M9 21h.01M18 21h.01",
  arrow: "M5 12h14m-6-6 6 6-6 6", chevron: "m9 5 7 7-7 7", down: "m6 9 6 6 6-6",
  close: "m6 6 12 12M6 18 18 6", plus: "M12 5v14M5 12h14", minus: "M5 12h14",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  filter: "M4 7h16M4 17h16M8 4v6m8 4v6", download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  external: "M14 3h7v7m0-7L10 14M10 3H3v18h18v-7",
  box: "m3 7 9-5 9 5v10l-9 5-9-5V7Zm0 0 9 5 9-5M12 12v10M7.5 4.5l9 5",
  truck: "M1 3h13v13H1V3Zm13 5h4l4 4v4h-8M5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm13 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  check: "m5 12 4 4L19 6", mail: "M3 5h18v14H3V5Zm0 0 9 8 9-8",
  home: "m3 10 9-7 9 7v11h-7v-7h-4v7H3V10Z", menu: "M3 6h18M3 12h18M3 18h18",
  info: "M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
} as const;

export function Icon({ name, size = 20, className = "", style }: { name: keyof typeof paths; size?: number; className?: string; style?: CSSProperties }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}><path d={paths[name]} /></svg>;
}
