/** Tokens essenciais da ÓRBITA. A fonte de verdade completa é orbita.tokens.json. */
export const orbitaTokens = {
  color: {
    brand: { orbital: "#5E82FF", connection: "#8A62FF", pulse: "#E350EA", deepNight: "#090A20" },
    subsystem: { flow: "#367CFF", transparency: "#13BFAE", intelligence: "#9554E8" },
    semantic: { information: "#2559C7", success: "#157A55", warning: "#9A5800", danger: "#B42318", focus: "#5E82FF" }
  },
  fontFamily: '"Noto Sans", Arial, sans-serif',
  control: { compact: 36, default: 44, touch: 48 },
  sidebar: { expanded: 280, collapsed: 72 },
  breakpoint: { small: 640, medium: 960, large: 1280, xlarge: 1600 }
} as const;

export type OrbitaTokens = typeof orbitaTokens;
