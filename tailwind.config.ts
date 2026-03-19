import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // ÉMERAUDE VELOUTÉE
        emerald: {
          deep:    '#0A3D35',
          DEFAULT: '#0D5C4A',
          rich:    '#0F7A60',
          light:   '#1A9E7A',
          pale:    '#D1F5EC',
          subtle:  'rgba(13,92,74,0.07)',
          border:  'rgba(13,92,74,0.20)',
        },

        // OR ROYAL
        gold: {
          DEFAULT: '#C9A84C',
          light:   '#E8C97A',
          dim:     '#8B6E2F',
          pale:    '#FDF3DC',
          subtle:  'rgba(201,168,76,0.08)',
          border:  'rgba(201,168,76,0.25)',
        },

        // TURQUOISE ACCENT
        turquoise: {
          DEFAULT: '#0ABFAA',
          light:   '#2DD4BF',
          pale:    '#CCFBF1',
          subtle:  'rgba(10,191,170,0.07)',
        },

        // FONDS CLAIRS
        cream:   '#FAFAF7',
        pearl:   '#F4F1EA',
        ivory:   '#EEEAE0',
        white:   '#FFFFFF',

        // TEXTE
        ink:      '#0A1F1A',
        charcoal: '#1E3A32',
        slate:    '#4A6B5E',
        dust:     '#8AA89E',

        // BORDURES
        line:    'rgba(0,0,0,0.07)',
        linemed: 'rgba(0,0,0,0.13)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
