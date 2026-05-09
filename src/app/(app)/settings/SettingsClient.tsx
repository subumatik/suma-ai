'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, TextField, Button, Avatar, Divider, Chip,
  IconButton, InputAdornment, Snackbar, Alert,
} from '@mui/material';
import { Person, Save, Balance, Email, Phone, ContentCopy, Key } from '@mui/icons-material';

interface SettingsClientProps {
  profile: any;
  userId: string;
}

export default function SettingsClient({ profile, userId }: SettingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    specialization: profile?.specialization ?? '',
    baro_number: profile?.baro_number ?? '',
  });

  const handleSave = async () => {
    setLoading(true);
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      alert(data?.error ?? 'Profil güncellenemedi');
      return;
    }
    router.refresh();
  };

  const handleCopyReferralCode = () => {
    if (profile?.referans_kodu) {
      navigator.clipboard.writeText(profile.referans_kodu);
      setCopied(true);
    }
  };

  const roleLabel = profile?.role === 'lawyer' ? 'Avukat' : profile?.role === 'admin' ? 'Yönetici' : 'Müvekkil';

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, fontSize: { xs: '1.5rem', md: '2rem' } }}>Profil</Typography>

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.dark', fontSize: 32, fontWeight: 700, mx: 'auto', mb: 2 }}>
              {(form.full_name?.charAt(0) ?? 'U').toUpperCase()}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>{form.full_name || 'Kullanıcı'}</Typography>
            <Chip label={roleLabel} color="primary" variant="outlined" />
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Ad Soyad"
              fullWidth
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <TextField
              label="E-posta"
              fullWidth
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Telefon"
              fullWidth
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            {profile?.role === 'lawyer' && (
              <>
                <TextField
                  label="Uzmanlık Alanı"
                  fullWidth
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                />
                <TextField
                  label="Baro Numarası"
                  fullWidth
                  value={form.baro_number}
                  onChange={(e) => setForm({ ...form, baro_number: e.target.value })}
                />

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Key sx={{ fontSize: 18, color: 'primary.main' }} /> Referans Kodu
                </Typography>
                <TextField
                  fullWidth
                  value={profile?.referans_kodu ?? 'Henüz atanmadı'}
                  slotProps={{
                    input: {
                      readOnly: true,
                      endAdornment: profile?.referans_kodu ? (
                        <InputAdornment position="end">
                          <IconButton onClick={handleCopyReferralCode} edge="end" size="small">
                            <ContentCopy sx={{ fontSize: 18 }} />
                          </IconButton>
                        </InputAdornment>
                      ) : undefined,
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  helperText="Bu kodu müvekkillerinizle paylaşarak sisteme kayıt olmalarını sağlayabilirsiniz."
                />
              </>
            )}
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </CardContent>
      </Card>

      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          Referans kodu kopyalandı!
        </Alert>
      </Snackbar>
    </Box>
  );
}
