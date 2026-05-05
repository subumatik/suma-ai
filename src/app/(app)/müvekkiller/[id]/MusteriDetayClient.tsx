'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Card, CardContent, Typography, Button, Chip, Grid, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import { Person, Add, Folder, Mail, Phone, ArrowBack } from '@mui/icons-material';

interface Props {
  client: any;
  dosyalar: any[];
  statuses: any[];
  role: string;
  userId: string;
}

export default function MusteriDetayClient({ client, dosyalar, statuses, role, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newDosya, setNewDosya] = useState({ title: '', description: '', file_number: '', court_name: '', status_id: '' });

  const handleCreate = async () => {
    if (!newDosya.title || !newDosya.status_id) return;
    setLoading(true);
    await supabase.from('dosyalar').insert({
      ...newDosya,
      lawyer_id: userId,
      client_id: client.id,
    });
    setLoading(false);
    setOpen(false);
    setNewDosya({ title: '', description: '', file_number: '', court_name: '', status_id: '' });
    router.refresh();
  };

  const defaultStatus = statuses.find((s) => s.is_default)?.id ?? statuses[0]?.id ?? '';

  return (
    <Box>
      <Button onClick={() => router.push('/müvekkiller')} sx={{ mb: 2 }} startIcon={<ArrowBack />}>Müvekkillere Dön</Button>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: 'secondary.dark', fontSize: 28, fontWeight: 700 }}>
              {(client.full_name?.charAt(0) ?? 'M').toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{client.full_name ?? 'İsimsiz'}</Typography>
              <Chip label="Müvekkil" color="primary" variant="outlined" size="small" />
            </Box>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Mail sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{client.email ?? '-'}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{client.phone ?? '-'}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Dosyalar</Typography>
        {role === 'lawyer' && (
          <Button variant="contained" startIcon={<Add />} onClick={() => { setNewDosya({ ...newDosya, status_id: defaultStatus }); setOpen(true); }}>
            Yeni Dosya Aç
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        {dosyalar.map((d) => (
          <Grid size={{ xs: 12, md: 6 }} key={d.id}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => router.push(`/dosyalar/${d.id}`)}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{d.title}</Typography>
                  <Chip size="small" label={d.status?.name ?? '-'} sx={{ bgcolor: (d.status?.color ?? '#3B82F6') + '20', color: d.status?.color ?? '#3B82F6' }} />
                </Box>
                {d.category?.name && <Chip size="small" label={d.category.name} sx={{ bgcolor: (d.category.color ?? '#3B82F6') + '15', color: d.category.color ?? '#3B82F6', mb: 1 }} />}
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{d.file_number ?? 'Dosya No: Belirtilmemiş'}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {dosyalar.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Folder sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>Henüz dosya bulunmuyor</Typography>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Dosya Aç</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Dosya Başlığı" fullWidth value={newDosya.title} onChange={(e) => setNewDosya({ ...newDosya, title: e.target.value })} />
          <TextField label="Açıklama" fullWidth multiline rows={2} value={newDosya.description} onChange={(e) => setNewDosya({ ...newDosya, description: e.target.value })} />
          <TextField label="Dosya Numarası" fullWidth value={newDosya.file_number} onChange={(e) => setNewDosya({ ...newDosya, file_number: e.target.value })} />
          <TextField label="Mahkeme" fullWidth value={newDosya.court_name} onChange={(e) => setNewDosya({ ...newDosya, court_name: e.target.value })} />
          <TextField select label="Durum" fullWidth value={newDosya.status_id} onChange={(e) => setNewDosya({ ...newDosya, status_id: e.target.value })}
            slotProps={{ select: { native: true } }}>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading || !newDosya.title || !newDosya.status_id}>Oluştur</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
