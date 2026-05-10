'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Card, CardContent, Typography, Button, TextField, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, InputAdornment, IconButton,
  Autocomplete, useMediaQuery, useTheme, Stack,
} from '@mui/material';
import {
  Folder, Search, Add, Edit, Delete, Person, People,
} from '@mui/icons-material';

interface CasesClientProps {
  dosyalar: any[];
  role: string;
  userId: string;
  categories: any[];
  statuses: any[];
  clients: any[];
  lawyersAll: any[];
}

export default function CasesClient({ dosyalar, role, userId, categories, statuses, clients, lawyersAll }: CasesClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newDosya, setNewDosya] = useState({
    title: '', description: '', file_number: '', court_name: '', court_file_no: '',
    selectedClients: [] as any[],
    selectedLawyers: [] as any[],
    category_id: '', status_id: '',
  });
  const [editDosya, setEditDosya] = useState<any>(null);
  const [editLawyers, setEditLawyers] = useState<any[]>([]);
  const [editClients, setEditClients] = useState<any[]>([]);

  const filtered = dosyalar.filter((d) => {
    const matchesSearch = !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.file_number?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !catFilter || d.category_id === catFilter;
    const matchesStatus = !statusFilter || d.status_id === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const openEdit = (d: any) => {
    setEditDosya({ ...d });
    setEditLawyers((d.lawyers ?? []).map((l: any) => l.lawyer).filter(Boolean));
    setEditClients((d.clients ?? []).map((c: any) => c.client).filter(Boolean));
  };

  const handleCreate = async () => {
    if (role === 'client') return;
    if (!newDosya.title || newDosya.selectedClients.length === 0 || !newDosya.status_id) return;
    setLoading(true);

    // Always include current user as a lawyer if they are a lawyer (in addition to selected lawyers)
    const lawyerIds = new Set<string>(newDosya.selectedLawyers.map((l) => l.id));
    if (role === 'lawyer') lawyerIds.add(userId);

    const { data: created, error: createErr } = await supabase.from('dosyalar').insert({
      title: newDosya.title,
      description: newDosya.description || null,
      file_number: newDosya.file_number || null,
      court_name: newDosya.court_name || null,
      court_file_no: newDosya.court_file_no || null,
      category_id: newDosya.category_id || null,
      status_id: newDosya.status_id,
      created_by: userId,
    }).select('id').single();

    if (createErr || !created) {
      setLoading(false);
      return;
    }

    const lawyerInserts = Array.from(lawyerIds).map((lid) => ({ dosya_id: created.id, lawyer_id: lid }));
    const clientInserts = newDosya.selectedClients.map((c) => ({ dosya_id: created.id, client_id: c.id }));
    if (lawyerInserts.length) await supabase.from('dosya_lawyers').insert(lawyerInserts);
    if (clientInserts.length) await supabase.from('dosya_clients').insert(clientInserts);

    setLoading(false);
    setOpen(false);
    setNewDosya({ title: '', description: '', file_number: '', court_name: '', court_file_no: '', selectedClients: [], selectedLawyers: [], category_id: '', status_id: '' });
    router.refresh();
  };

  const handleUpdate = async () => {
    if (role === 'client' || !editDosya) return;
    if (!editDosya.title || editClients.length === 0 || !editDosya.status_id) return;
    setLoading(true);

    await supabase.from('dosyalar').update({
      title: editDosya.title,
      description: editDosya.description || null,
      file_number: editDosya.file_number || null,
      court_name: editDosya.court_name || null,
      court_file_no: editDosya.court_file_no || null,
      category_id: editDosya.category_id || null,
      status_id: editDosya.status_id,
    }).eq('id', editDosya.id);

    // Sync junction tables
    const existingLawyers = (editDosya.lawyers ?? []).map((l: any) => l.lawyer?.id).filter(Boolean) as string[];
    const newLawyerIds = editLawyers.map((l) => l.id);
    const lawyersToAdd = newLawyerIds.filter((id) => !existingLawyers.includes(id));
    const lawyersToRemove = existingLawyers.filter((id) => !newLawyerIds.includes(id));

    const existingClients = (editDosya.clients ?? []).map((c: any) => c.client?.id).filter(Boolean) as string[];
    const newClientIds = editClients.map((c) => c.id);
    const clientsToAdd = newClientIds.filter((id) => !existingClients.includes(id));
    const clientsToRemove = existingClients.filter((id) => !newClientIds.includes(id));

    if (lawyersToAdd.length) {
      await supabase.from('dosya_lawyers').insert(lawyersToAdd.map((lid) => ({ dosya_id: editDosya.id, lawyer_id: lid })));
    }
    if (lawyersToRemove.length) {
      await supabase.from('dosya_lawyers').delete().eq('dosya_id', editDosya.id).in('lawyer_id', lawyersToRemove);
    }
    if (clientsToAdd.length) {
      await supabase.from('dosya_clients').insert(clientsToAdd.map((cid) => ({ dosya_id: editDosya.id, client_id: cid })));
    }
    if (clientsToRemove.length) {
      await supabase.from('dosya_clients').delete().eq('dosya_id', editDosya.id).in('client_id', clientsToRemove);
    }

    setLoading(false);
    setEditDosya(null);
    setEditLawyers([]);
    setEditClients([]);
    router.refresh();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (role === 'client') return;
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz? İlgili tüm belgeler de silinecektir.')) return;
    await supabase.from('dosyalar').delete().eq('id', id);
    router.refresh();
  };

  const defaultStatus = statuses.find((s) => s.is_default)?.id ?? statuses[0]?.id ?? '';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' } }}>Dosyalar</Typography>
        {role !== 'client' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { setNewDosya({ ...newDosya, status_id: defaultStatus }); setOpen(true); }}
            fullWidth={isMobile}
          >
            Yeni Dosya
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', flexDirection: { xs: 'column', md: 'row' } }}>
          <TextField
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: { md: 200 } }}
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
        {filtered.map((d) => {
          const dosyaLawyers = (d.lawyers ?? []).map((l: any) => l.lawyer).filter(Boolean);
          const dosyaClients = (d.clients ?? []).map((c: any) => c.client).filter(Boolean);
          return (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={d.id}>
              <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => router.push(`/cases/${d.id}`)}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, wordBreak: 'break-word' }}>{d.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{d.file_number ?? 'Dosya No: Belirtilmemiş'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
                      <Chip size="small" label={d.status?.name ?? '-'} sx={{ bgcolor: (d.status?.color ?? '#3B82F6') + '20', color: d.status?.color ?? '#3B82F6' }} />
                      {role === 'lawyer' && (
                        <Box sx={{ display: 'flex' }}>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(d); }}><Edit fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={(e) => handleDelete(e, d.id)}><Delete fontSize="small" /></IconButton>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  {d.category?.name && (
                    <Chip size="small" label={d.category.name} sx={{ bgcolor: (d.category.color ?? '#3B82F6') + '15', color: d.category.color ?? '#3B82F6', mb: 1.5 }} />
                  )}
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {d.description ?? 'Açıklama bulunmuyor.'}
                  </Typography>
                  <Stack spacing={0.75} sx={{ mb: 1 }}>
                    {dosyaLawyers.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {dosyaLawyers.map((l: any) => l.full_name).filter(Boolean).join(', ')}
                        </Typography>
                      </Box>
                    )}
                    {dosyaClients.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <People sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {dosyaClients.map((c: any) => c.full_name).filter(Boolean).join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'right' }}>
                    {new Date(d.updated_at).toLocaleDateString('tr-TR')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Folder sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>Dosya bulunamadı</Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>Arama kriterlerinize uygun dosya bulunmuyor.</Typography>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Yeni Dosya Oluştur</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, overflow: 'auto' }}>
          <TextField label="Dosya Başlığı" fullWidth value={newDosya.title} onChange={(e) => setNewDosya({ ...newDosya, title: e.target.value })} sx={{ mt: 1 }} />
          <TextField label="Açıklama" fullWidth multiline rows={2} value={newDosya.description} onChange={(e) => setNewDosya({ ...newDosya, description: e.target.value })} />
          <TextField label="Dosya Numarası" fullWidth value={newDosya.file_number} onChange={(e) => setNewDosya({ ...newDosya, file_number: e.target.value })} />
          <Autocomplete
            multiple
            options={clients}
            getOptionLabel={(o) => o.full_name ?? ''}
            value={newDosya.selectedClients}
            onChange={(_, v) => setNewDosya({ ...newDosya, selectedClients: v })}
            renderInput={(params) => <TextField {...params} label="Müvekkiller *" placeholder="Müvekkil seçin" />}
            isOptionEqualToValue={(o, v) => o.id === v.id}
          />
          <Autocomplete
            multiple
            options={lawyersAll.filter((l) => l.id !== userId)}
            getOptionLabel={(o) => `${o.full_name ?? ''}${o.specialization ? ` - ${o.specialization}` : ''}`}
            value={newDosya.selectedLawyers}
            onChange={(_, v) => setNewDosya({ ...newDosya, selectedLawyers: v })}
            renderInput={(params) => <TextField {...params} label="Diğer Avukatlar (Opsiyonel)" placeholder="Avukat ekleyin" />}
            isOptionEqualToValue={(o, v) => o.id === v.id}
          />
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
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading || !newDosya.title || newDosya.selectedClients.length === 0 || !newDosya.status_id}>
            Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editDosya} onClose={() => setEditDosya(null)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Dosyayı Düzenle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, overflow: 'auto' }}>
          <TextField label="Dosya Başlığı" fullWidth value={editDosya?.title || ''} onChange={(e) => setEditDosya({ ...editDosya, title: e.target.value })} sx={{ mt: 1 }} />
          <TextField label="Açıklama" fullWidth multiline rows={2} value={editDosya?.description || ''} onChange={(e) => setEditDosya({ ...editDosya, description: e.target.value })} />
          <TextField label="Dosya Numarası" fullWidth value={editDosya?.file_number || ''} onChange={(e) => setEditDosya({ ...editDosya, file_number: e.target.value })} />
          <Autocomplete
            multiple
            options={clients}
            getOptionLabel={(o) => o.full_name ?? ''}
            value={editClients}
            onChange={(_, v) => setEditClients(v)}
            renderInput={(params) => <TextField {...params} label="Müvekkiller *" />}
            isOptionEqualToValue={(o, v) => o.id === v.id}
          />
          <Autocomplete
            multiple
            options={lawyersAll}
            getOptionLabel={(o) => `${o.full_name ?? ''}${o.specialization ? ` - ${o.specialization}` : ''}`}
            value={editLawyers}
            onChange={(_, v) => setEditLawyers(v)}
            renderInput={(params) => <TextField {...params} label="Avukatlar" />}
            isOptionEqualToValue={(o, v) => o.id === v.id}
          />
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
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setEditDosya(null)}>İptal</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={loading || !editDosya?.title || editClients.length === 0 || !editDosya?.status_id}>
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
