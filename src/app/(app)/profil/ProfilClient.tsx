'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Card, CardContent, Typography, TextField, Button, Avatar, Divider, Chip,
} from '@mui/material';
import { Person, Save, Balance, Email, Phone } from '@mui/icons-material';

interface ProfilClientProps {
  profile: any;
  userId: string;
}

export default function ProfilClient({ profile, userId }: ProfilClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    specialization: profile?.specialization ?? '',
    baro_number: profile?.baro_number ?? '',
  });

  const handleSave = async () => {
    setLoading(true);
    await supabase.from('profiles').update({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      specialization: form.specialization || null,
      baro_number: form.baro_number || null,
    }).eq('id', userId);
    setLoading(false);
    router.refresh();
  };

  const roleLabel = profile?.role === 'lawyer' ? 'Avukat' : profile?.role === 'admin' ? 'Yönetici' : 'Müvekkil';

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Profil</Typography>

      <Card>
        <CardContent sx={{ p: 4 }}>
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
    </Box>
  );
}
