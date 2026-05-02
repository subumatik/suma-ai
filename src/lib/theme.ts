'use client';

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    dark: {
      palette: {
        primary: { main: '#5DCAA5', dark: '#0F6E56', light: '#7FD4B7', contrastText: '#000' },
        secondary: { main: '#85B7EB', dark: '#185FA5', light: '#A3CBF0', contrastText: '#000' },
        error: { main: '#E07070', dark: '#791F1F', light: '#FFB6B6' },
        warning: { main: '#E8A845', dark: '#854F0B', light: '#F0C87A' },
        info: { main: '#85B7EB', dark: '#185FA5', light: '#A3CBF0' },
        success: { main: '#5DCAA5', dark: '#0F6E56', light: '#7FD4B7' },
        background: { default: '#1a1a18', paper: '#2C2C2A' },
        text: { primary: '#D3D1C7', secondary: '#B4B2A9', disabled: '#888780' },
        divider: 'rgba(255,255,255,0.08)',
      },
    },
    light: {
      palette: {
        primary: { main: '#0F6E56', dark: '#085C47', light: '#5DCAA5', contrastText: '#fff' },
        secondary: { main: '#185FA5', dark: '#124B82', light: '#85B7EB', contrastText: '#fff' },
        error: { main: '#D32F2F', dark: '#9A0007', light: '#EF5350', contrastText: '#fff' },
        warning: { main: '#F57C00', dark: '#BB4D00', light: '#FFB74D', contrastText: '#000' },
        info: { main: '#185FA5', dark: '#124B82', light: '#85B7EB', contrastText: '#fff' },
        success: { main: '#0F6E56', dark: '#085C47', light: '#5DCAA5', contrastText: '#fff' },
        background: { default: '#F8F7F2', paper: '#FFFFFF' },
        text: { primary: '#1E1E1E', secondary: '#5C5C5C', disabled: '#9E9E9E' },
        divider: 'rgba(0,0,0,0.08)',
      },
    },
  },
  typography: {
    fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',
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
    MuiListItemButton: { styleOverrides: { root: { borderRadius: 10, marginBottom: 2, '&.Mui-selected': { backgroundColor: 'rgba(93,202,165,0.12)' } } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});
