'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  Avatar, Chip, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, useMediaQuery, useTheme,
} from '@mui/material';
import { Person, Search, CalendarMonth, Mail, Phone, Add } from '@mui/icons-material';

interface LawyersClientProps {
  lawyers: any[];
  userId: string;
  role: string;
}

export default function LawyersClient({ lawyers, userId, role }: LawyersClientProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const filtered = lawyers.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.full_name?.toLowerCase().includes(q) ||
      l.specialization?.toLowerCase().includes(q) ||
      l.baro_number?.toLowerCase().includes(q)
    );
  });

  const handleConnect = async () => {
    if (!refCode.trim()) return;
    setConnectLoading(true);
    try {
      const res = await fetch('/api/clients/connect-lawyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: refCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bağlantı kurulamadı');
      setToast({ open: true, message: `${data.lawyer?.full_name || 'Avukat'} başarıyla eklendi.`, severity: 'success' });
      setOpenDialog(false);
      setRefCode('');
      router.refresh();
    } catch (err: any) {
      setToast({ open: true, message: err.message, severity: 'error' });
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' } }}>Avukatlar</Typography>
        {role === 'client' && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)} fullWidth={isMobile}>
            Avukat Ekle
          </Button>
        )}
      </Box>

      <TextField
        placeholder="Avukat ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Grid container spacing={2}>
        {filtered.map((l) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={l.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.dark', width: 56, height: 56, fontSize: 20, fontWeight: 700 }}>
                    {(l.full_name?.charAt(0) ?? 'A').toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{l.full_name}</Typography>
                    {l.specialization && (
                      <Chip size="small" label={l.specialization} color="primary" variant="outlined" />
                    )}
                  </Box>
                </Box>

                {l.baro_number && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Baro No: {l.baro_number}</Typography>
                  </Box>
                )}
                {l.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Mail sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{l.email}</Typography>
                  </Box>
                )}
                {l.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{l.phone}</Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Button variant="contained" fullWidth startIcon={<CalendarMonth />} onClick={() => router.push(`/appointments?lawyer=${l.id}`)}>
                    Randevu Al
                  </Button>
                  <Button variant="outlined" fullWidth startIcon={<Person />} onClick={() => router.push(`/messages?u=${l.id}`)}>
                    Mesaj
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Person sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>Avukat bulunamadı</Typography>
        </Box>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Avukat Ekle</DialogTitle>
        <DialogContent sx={{ pt: 2, overflow: 'visible' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Avukatınızın referans kodunu girerek bağlantı kurabilirsiniz.
          </Typography>
          <TextField
            label="Referans Kodu"
            fullWidth
            value={refCode}
            onChange={(e) => setRefCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConnect(); }}
            placeholder="Örn: ABC123"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button variant="contained" onClick={handleConnect} disabled={connectLoading || !refCode.trim()}>
            {connectLoading ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
