'use client';

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    dark: {
      palette: {
        primary: { main: '#E4E4E7', dark: '#A1A1AA', light: '#FAFAFA', contrastText: '#09090B' },
        secondary: { main: '#C9A227', dark: '#8B6914', light: '#E8C547', contrastText: '#000' },
        error: { main: '#EF4444', dark: '#991B1B', light: '#FCA5A5' },
        warning: { main: '#F59E0B', dark: '#92400E', light: '#FCD34D' },
        info: { main: '#71717A', dark: '#52525B', light: '#A1A1AA' },
        success: { main: '#10B981', dark: '#065F46', light: '#6EE7B7' },
        background: { default: '#09090B', paper: '#18181B' },
        text: { primary: '#F4F4F5', secondary: '#A1A1AA', disabled: '#71717A' },
        divider: 'rgba(255,255,255,0.08)',
      },
    },
    light: {
      palette: {
        primary: { main: '#27272A', dark: '#09090B', light: '#52525B', contrastText: '#fff' },
        secondary: { main: '#C9A227', dark: '#8B6914', light: '#E8C547', contrastText: '#000' },
        error: { main: '#DC2626', dark: '#991B1B', light: '#EF4444', contrastText: '#fff' },
        warning: { main: '#D97706', dark: '#92400E', light: '#F59E0B', contrastText: '#000' },
        info: { main: '#52525B', dark: '#27272A', light: '#A1A1AA', contrastText: '#fff' },
        success: { main: '#059669', dark: '#065F46', light: '#10B981', contrastText: '#fff' },
        background: { default: '#FAFAFA', paper: '#FFFFFF' },
        text: { primary: '#09090B', secondary: '#52525B', disabled: '#A1A1AA' },
        divider: 'rgba(0,0,0,0.08)',
      },
    },
  },
  typography: {
    fontFamily: 'var(--font-montserrat),"Inter","Roboto","Helvetica","Arial",sans-serif',
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
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 16,
          border: '1px solid var(--mui-palette-divider)',
          boxShadow: theme.palette.mode === 'dark' ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.2s',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.15)',
          },
        }),
      },
    },
    MuiButton: { styleOverrides: { root: { borderRadius: 10, textTransform: 'none', fontWeight: 600 } } },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(128,128,128,0.04)',
          },
        }),
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } } },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          marginBottom: 2,
          '&.Mui-selected': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(39,39,42,0.12)',
          },
        }),
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});
