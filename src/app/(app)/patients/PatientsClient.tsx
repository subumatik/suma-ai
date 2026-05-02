'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, IconButton,
} from '@mui/material';
import { PersonAdd, Delete, Visibility } from '@mui/icons-material';
import { createClient } from '@/lib/supabase/client';

interface Patient {
  id: string;
  anonymous_hash: string;
  age: number | null;
  gender: string | null;
  notes: string | null;
  created_at: string;
}

export default function PatientsClient({ patients }: { patients: Patient[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const hash = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const { error } = await supabase.from('patients').insert({
      anonymous_hash: hash,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      notes: notes || null,
    });
    setLoading(false);
    if (!error) {
      setOpen(false);
      setAge('');
      setGender('');
      setNotes('');
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hasta silinecek. Emin misiniz?')) return;
    await supabase.from('patients').delete().eq('id', id);
    router.refresh();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Hastalar</Typography>
        <Button variant="contained" startIcon={<PersonAdd />} sx={{ borderRadius: 3 }} onClick={() => setOpen(true)}>
          Yeni Hasta
        </Button>
      </Box>

      <Paper elevation={2} sx={{ borderRadius: 3, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Hasta ID</TableCell>
                <TableCell>Yaş</TableCell>
                <TableCell>Cinsiyet</TableCell>
                <TableCell>Notlar</TableCell>
                <TableCell>Kayıt Tarihi</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12 }}>
                        {patient.anonymous_hash.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {patient.anonymous_hash}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{patient.age ?? '-'}</TableCell>
                  <TableCell>
                    <Chip label={patient.gender ?? 'Belirtilmemiş'} size="small" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {patient.notes ?? '-'}
                  </TableCell>
                  <TableCell>{new Date(patient.created_at).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => router.push(`/patients/${patient.id}`)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(patient.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {patients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Henüz hasta kaydı yok. Yeni hasta ekleyin.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Hasta Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 6 }}>
              <TextField label="Yaş" type="number" fullWidth value={age} onChange={(e) => setAge(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Cinsiyet" fullWidth value={gender} onChange={(e) => setGender(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Notlar" fullWidth multiline rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
