export interface Theme {
  key: string;
  name: string;
  colors: {
    accent: string;
    hover: string;
    ring: string;
  };
}

export const THEMES: Theme[] = [
  { key: 'sky', name: 'Sky', colors: { accent: '#38bdf8', hover: '#0ea5e9', ring: '#38bdf8' } },
  { key: 'rose', name: 'Rose', colors: { accent: '#fb7185', hover: '#f43f5e', ring: '#fb7185' } },
  { key: 'emerald', name: 'Emerald', colors: { accent: '#34d399', hover: '#10b981', ring: '#34d399' } },
  { key: 'amber', name: 'Amber', colors: { accent: '#fbbf24', hover: '#f59e0b', ring: '#fbbf24' } },
  { key: 'violet', name: 'Violet', colors: { accent: '#a78bfa', hover: '#8b5cf6', ring: '#a78bfa' } },
  { key: 'indigo', name: 'Indigo', colors: { accent: '#818cf8', hover: '#6366f1', ring: '#818cf8' } },
  { key: 'fuchsia', name: 'Fuchsia', colors: { accent: '#e879f9', hover: '#d946ef', ring: '#e879f9' } },
  { key: 'teal', name: 'Teal', colors: { accent: '#2dd4bf', hover: '#14b8a6', ring: '#2dd4bf' } },
  { key: 'cyan', name: 'Cyan', colors: { accent: '#22d3ee', hover: '#06b6d4', ring: '#22d3ee' } },
  { key: 'lime', name: 'Lime', colors: { accent: '#a3e635', hover: '#84cc16', ring: '#a3e635' } },
];
