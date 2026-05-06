'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Card, CardContent, Typography, Button, TextField, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, InputAdornment, IconButton
} from '@mui/material';
import {
  Folder, Search, Add, FilterList, Edit, Delete
} from '@mui/icons-material';

interface CasesClientProps {
  dosyalar: any[];
  role: string;
  userId: string;
  categories: any[];
  statuses: any[];
  clients: any[];
}

export default function CasesClient({ dosyalar, role, userId, categories, statuses, clients }: CasesClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newDosya, setNewDosya] = useState({ title: '', description: '', file_number: '', court_name: '', court_file_no: '', client_id: '', category_id: '', status_id: '' });
  const [editDosya, setEditDosya] = useState<any>(null);

  const filtered = dosyalar.filter((d) => {
    const matchesSearch = !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.file_number?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !catFilter || d.category_id === catFilter;
    const matchesStatus = !statusFilter || d.status_id === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleCreate = async () => {
    if (role === 'client') return;
    if (!newDosya.title || !newDosya.client_id || !newDosya.status_id) return;
    setLoading(true);
    await supabase.from('dosyalar').insert({
      ...newDosya,
      lawyer_id: userId,
    });
    setLoading(false);
    setOpen(false);
    setNewDosya({ title: '', description: '', file_number: '', court_name: '', court_file_no: '', client_id: '', category_id: '', status_id: '' });
    router.refresh();
  };

  const handleUpdate = async () => {
    if (role === 'client') return;
    if (!editDosya.title || !editDosya.client_id || !editDosya.status_id) return;
    setLoading(true);
    await supabase.from('dosyalar').update({
      title: editDosya.title,
      description: editDosya.description,
      file_number: editDosya.file_number,
      court_name: editDosya.court_name,
      court_file_no: editDosya.court_file_no,
      client_id: editDosya.client_id,
      category_id: editDosya.category_id,
      status_id: editDosya.status_id,
    }).eq('id', editDosya.id);
    setLoading(false);
    setEditDosya(null);
    router.refresh();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (role === 'client') return;
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz? İlgili tüm belgeler de silinecektir.')) return;
    await supabase.from('dosyalar').delete().eq('id', id);
    router.refresh();
  };

  // Varsayılan durum
  const defaultStatus = statuses.find((s) => s.is_default)?.id ?? statuses[0]?.id ?? '';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Dosyalar</Typography>
        {role !== 'client' && (
          <Button variant="contained" startIcon={<Add />} onClick={() => { setNewDosya({ ...newDosya, status_id: defaultStatus }); setOpen(true); }}>
            Yeni Dosya
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
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
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                size="small"
                sx={{ bgcolor: catFilter === c.id ? c.color + '30' : 'transparent', color: c.color, border: `1px solid ${c.color}40`, cursor: 'pointer' }}
                onClick={() => setCatFilter(catFilter === c.id ? null : c.id)}
              />
            ))}
            {statuses.map((s) => (
              <Chip
                key={s.id}
                label={s.name}
                size="small"
                sx={{ bgcolor: statusFilter === s.id ? s.color + '30' : 'transparent', color: s.color, border: `1px solid ${s.color}40`, cursor: 'pointer' }}
                onClick={() => setStatusFilter(statusFilter === s.id ? null : s.id)}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {filtered.map((d) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={d.id}>
            <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => router.push(`/cases/${d.id}`)}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{d.title}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{d.file_number ?? 'Dosya No: Belirtilmemiş'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip size="small" label={d.status?.name ?? '-'} sx={{ bgcolor: (d.status?.color ?? '#3B82F6') + '20', color: d.status?.color ?? '#3B82F6' }} />
                    {role === 'lawyer' && (
                      <Box sx={{ display: 'flex' }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditDosya(d); }}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={(e) => handleDelete(e, d.id)}><Delete fontSize="small" /></IconButton>
                      </Box>
                    )}
                  </Box>
                </Box>
                {d.category?.name && (
                  <Chip size="small" label={d.category.name} sx={{ bgcolor: (d.category.color ?? '#3B82F6') + '15', color: d.category.color ?? '#3B82F6', mb: 1.5 }} />
                )}
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineClamp: 2 }}>
                  {d.description ?? 'Açıklama bulunmuyor.'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {role === 'lawyer' ? d.client?.full_name : d.lawyer?.full_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {new Date(d.updated_at).toLocaleDateString('tr-TR')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Folder sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>Dosya bulunamadı</Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>Arama kriterlerinize uygun dosya bulunmuyor.</Typography>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Dosya Oluştur</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Dosya Başlığı" fullWidth value={newDosya.title} onChange={(e) => setNewDosya({ ...newDosya, title: e.target.value })} />
          <TextField label="Açıklama" fullWidth multiline rows={2} value={newDosya.description} onChange={(e) => setNewDosya({ ...newDosya, description: e.target.value })} />
          <TextField label="Dosya Numarası" fullWidth value={newDosya.file_number} onChange={(e) => setNewDosya({ ...newDosya, file_number: e.target.value })} />
          <TextField
            select
            label="Müvekkil"
            fullWidth
            value={newDosya.client_id}
            onChange={(e) => setNewDosya({ ...newDosya, client_id: e.target.value })}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">Seçiniz</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </TextField>
          <TextField
            select
            label="Kategori"
            fullWidth
            value={newDosya.category_id}
            onChange={(e) => setNewDosya({ ...newDosya, category_id: e.target.value })}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">Seçiniz</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </TextField>
          <TextField
            select
            label="Durum"
            fullWidth
            value={newDosya.status_id}
            onChange={(e) => setNewDosya({ ...newDosya, status_id: e.target.value })}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </TextField>
          <TextField label="Mahkeme" fullWidth value={newDosya.court_name} onChange={(e) => setNewDosya({ ...newDosya, court_name: e.target.value })} />
          <TextField label="Mahkeme Dosya No" fullWidth value={newDosya.court_file_no} onChange={(e) => setNewDosya({ ...newDosya, court_file_no: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading || !newDosya.title || !newDosya.client_id || !newDosya.status_id}>
            Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editDosya} onClose={() => setEditDosya(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Dosyayı Düzenle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Dosya Başlığı" fullWidth value={editDosya?.title || ''} onChange={(e) => setEditDosya({ ...editDosya, title: e.target.value })} />
          <TextField label="Açıklama" fullWidth multiline rows={2} value={editDosya?.description || ''} onChange={(e) => setEditDosya({ ...editDosya, description: e.target.value })} />
          <TextField label="Dosya Numarası" fullWidth value={editDosya?.file_number || ''} onChange={(e) => setEditDosya({ ...editDosya, file_number: e.target.value })} />
          <TextField
            select
            label="Müvekkil"
            fullWidth
            value={editDosya?.client_id || ''}
            onChange={(e) => setEditDosya({ ...editDosya, client_id: e.target.value })}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">Seçiniz</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </TextField>
          <TextField
            select
            label="Kategori"
            fullWidth
            value={editDosya?.category_id || ''}
            onChange={(e) => setEditDosya({ ...editDosya, category_id: e.target.value })}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">Seçiniz</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </TextField>
          <TextField
            select
            label="Durum"
            fullWidth
            value={editDosya?.status_id || ''}
            onChange={(e) => setEditDosya({ ...editDosya, status_id: e.target.value })}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </TextField>
          <TextField label="Mahkeme" fullWidth value={editDosya?.court_name || ''} onChange={(e) => setEditDosya({ ...editDosya, court_name: e.target.value })} />
          <TextField label="Mahkeme Dosya No" fullWidth value={editDosya?.court_file_no || ''} onChange={(e) => setEditDosya({ ...editDosya, court_file_no: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDosya(null)}>İptal</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={loading || !editDosya?.title || !editDosya?.client_id || !editDosya?.status_id}>
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
