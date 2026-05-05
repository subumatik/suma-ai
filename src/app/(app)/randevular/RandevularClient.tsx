'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Card, CardContent, Typography, Button, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  CalendarMonth, Add, Schedule, CheckCircle, Cancel, Pending,
  Person, AccessTime,
} from '@mui/icons-material';

interface RandevularClientProps {
  appointments: any[];
  role: string;
  userId: string;
  lawyers: any[];
}

const statusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default'; icon: React.ReactNode }> = {
  REQUESTED: { label: 'Talep Edildi', color: 'warning', icon: <Pending sx={{ fontSize: 16 }} /> },
  CONFIRMED: { label: 'Onaylandı', color: 'success', icon: <CheckCircle sx={{ fontSize: 16 }} /> },
  CANCELLED: { label: 'İptal', color: 'error', icon: <Cancel sx={{ fontSize: 16 }} /> },
  COMPLETED: { label: 'Tamamlandı', color: 'info', icon: <Schedule sx={{ fontSize: 16 }} /> },
};

export default function RandevularClient({ appointments, role, userId, lawyers }: RandevularClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [filter, setFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newAppt, setNewAppt] = useState({ lawyer_id: '', topic: '', notes: '', appointment_date: '', duration_minutes: 60 });

  const filtered = appointments.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return new Date(a.appointment_date) > new Date() && a.status !== 'CANCELLED';
    if (filter === 'past') return new Date(a.appointment_date) <= new Date() || a.status === 'COMPLETED';
    return a.status === filter;
  });

  const handleCreate = async () => {
    if (!newAppt.lawyer_id || !newAppt.appointment_date || !newAppt.topic) return;
    setLoading(true);
    await supabase.from('appointments').insert({
      ...newAppt,
      client_id: userId,
      status: 'REQUESTED',
    });
    setLoading(false);
    setOpen(false);
    setNewAppt({ lawyer_id: '', topic: '', notes: '', appointment_date: '', duration_minutes: 60 });
    router.refresh();
  };

  const handleStatus = async (id: string, status: string) => {
    await supabase.from('appointments').update({ status }).eq('id', id);
    router.refresh();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Randevular</Typography>
        {role === 'client' && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
            Randevu Al
          </Button>
        )}
      </Box>

      <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => v && setFilter(v)} size="small" sx={{ mb: 3 }}>
        <ToggleButton value="all">Tümü</ToggleButton>
        <ToggleButton value="upcoming">Yaklaşan</ToggleButton>
        <ToggleButton value="past">Geçmiş</ToggleButton>
        <ToggleButton value="REQUESTED">Talep</ToggleButton>
        <ToggleButton value="CONFIRMED">Onaylı</ToggleButton>
      </ToggleButtonGroup>

      <Grid container spacing={2}>
        {filtered.map((a) => {
          const st = statusConfig[a.status] ?? statusConfig.REQUESTED;
          const isPast = new Date(a.appointment_date) <= new Date();
          return (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={a.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{a.topic ?? 'Randevu'}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {role === 'lawyer' ? a.client?.full_name : a.lawyer?.full_name}
                      </Typography>
                    </Box>
                    <Chip size="small" icon={st.icon as React.ReactElement} label={st.label} color={st.color} />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {new Date(a.appointment_date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {new Date(a.appointment_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · {a.duration_minutes} dk
                    </Typography>
                  </Box>

                  {a.notes && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>{a.notes}</Typography>
                  )}

                  {role === 'lawyer' && a.status === 'REQUESTED' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="contained" color="success" onClick={() => handleStatus(a.id, 'CONFIRMED')}>Onayla</Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleStatus(a.id, 'CANCELLED')}>Reddet</Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CalendarMonth sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>Randevu bulunamadı</Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>Henüz randevu bulunmuyor.</Typography>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Randevu Talebi</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField select label="Avukat" fullWidth value={newAppt.lawyer_id} onChange={(e) => setNewAppt({ ...newAppt, lawyer_id: e.target.value })}
            slotProps={{ select: { native: true } }}>
            <option value="">Seçiniz</option>
            {lawyers.map((l) => (
              <option key={l.id} value={l.id}>{l.full_name}{l.specialization ? ` - ${l.specialization}` : ''}</option>
            ))}
          </TextField>
          <TextField label="Konu" fullWidth value={newAppt.topic} onChange={(e) => setNewAppt({ ...newAppt, topic: e.target.value })} />
          <TextField label="Tarih ve Saat" type="datetime-local" fullWidth value={newAppt.appointment_date} onChange={(e) => setNewAppt({ ...newAppt, appointment_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Süre (dk)" type="number" fullWidth value={newAppt.duration_minutes} onChange={(e) => setNewAppt({ ...newAppt, duration_minutes: parseInt(e.target.value) || 60 })} />
          <TextField label="Notlar" fullWidth multiline rows={2} value={newAppt.notes} onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading || !newAppt.lawyer_id || !newAppt.appointment_date || !newAppt.topic}>
            Talep Gönder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
