'use client';

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    dark: {
      palette: {
        primary: { main: '#3B82F6', dark: '#1E3A5F', light: '#60A5FA', contrastText: '#fff' },
        secondary: { main: '#C9A227', dark: '#8B6914', light: '#E8C547', contrastText: '#000' },
        error: { main: '#EF4444', dark: '#991B1B', light: '#FCA5A5' },
        warning: { main: '#F59E0B', dark: '#92400E', light: '#FCD34D' },
        info: { main: '#3B82F6', dark: '#1E40AF', light: '#93C5FD' },
        success: { main: '#10B981', dark: '#065F46', light: '#6EE7B7' },
        background: { default: '#0F172A', paper: '#1E293B' },
        text: { primary: '#F1F5F9', secondary: '#94A3B8', disabled: '#64748B' },
        divider: 'rgba(148,163,184,0.12)',
      },
    },
    light: {
      palette: {
        primary: { main: '#1E3A5F', dark: '#0F172A', light: '#3B82F6', contrastText: '#fff' },
        secondary: { main: '#C9A227', dark: '#8B6914', light: '#E8C547', contrastText: '#000' },
        error: { main: '#DC2626', dark: '#991B1B', light: '#EF4444', contrastText: '#fff' },
        warning: { main: '#D97706', dark: '#92400E', light: '#F59E0B', contrastText: '#000' },
        info: { main: '#2563EB', dark: '#1E40AF', light: '#60A5FA', contrastText: '#fff' },
        success: { main: '#059669', dark: '#065F46', light: '#10B981', contrastText: '#fff' },
        background: { default: '#F8FAFC', paper: '#FFFFFF' },
        text: { primary: '#0F172A', secondary: '#475569', disabled: '#94A3B8' },
        divider: 'rgba(15,23,42,0.08)',
      },
    },
  },
  typography: {
    fontFamily: '"Montserrat","Inter","Roboto","Helvetica","Arial",sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: { styleOverrides: { root: { borderRadius: 16, border: '1px solid var(--mui-palette-divider)', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 10, textTransform: 'none', fontWeight: 600 } } },
    MuiTextField: { styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 10, backgroundColor: 'rgba(128,128,128,0.04)' } } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } } },
    MuiListItemButton: { styleOverrides: { root: { borderRadius: 10, marginBottom: 2, '&.Mui-selected': { backgroundColor: 'rgba(59,130,246,0.12)' } } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});
