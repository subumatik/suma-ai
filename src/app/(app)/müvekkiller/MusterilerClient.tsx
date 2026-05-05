'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  Avatar, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton,
} from '@mui/material';
import { People, Search, Mail, Phone, Add, Visibility, VisibilityOff } from '@mui/icons-material';

interface MusterilerClientProps {
  clients: any[];
  role: string;
}

export default function MusterilerClient({ clients, role }: MusterilerClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  const handleCreate = async () => {
    setError('');
    if (!form.full_name || !form.email || !form.password) {
      setError('Ad soyad, e-posta ve şifre zorunludur');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/clients/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Bir hata oluştu');
    } else {
      setOpen(false);
      setForm({ full_name: '', email: '', phone: '', password: '' });
      router.refresh();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Müvekkillerim</Typography>
        {role === 'lawyer' && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
            Yeni Müvekkil Ekle
          </Button>
        )}
      </Box>

      <TextField
        placeholder="Müvekkil ara..."
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
        {filtered.map((c) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={c.id}>
            <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => router.push(`/mesajlar?u=${c.id}`)}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.dark', width: 56, height: 56, fontSize: 20, fontWeight: 700 }}>
                    {(c.full_name?.charAt(0) ?? 'M').toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{c.full_name ?? 'İsimsiz'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Müvekkil</Typography>
                  </Box>
                </Box>
                {c.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Mail sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{c.email}</Typography>
                  </Box>
                )}
                {c.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{c.phone}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <People sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>Müvekkil bulunamadı</Typography>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Müvekkil Ekle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && (
            <Typography variant="body2" sx={{ color: 'error.main', mb: 1 }}>{error}</Typography>
          )}
          <TextField label="Ad Soyad" fullWidth value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <TextField label="E-posta" type="email" fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Telefon" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField
            label="Şifre"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading}>
            {loading ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
