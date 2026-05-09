'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Card, CardContent, Typography, Button, TextField, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, useMediaQuery, useTheme,
} from '@mui/material';
import { Add, Delete, Rule } from '@mui/icons-material';

const DEFAULT_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#6B7280'];

interface StatusesClientProps {
  statuses: any[];
  userId: string;
}

export default function StatusesClient({ statuses, userId }: StatusesClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState({ name: '', color: DEFAULT_COLORS[0], order: 0 });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!newStatus.name.trim()) return;
    setLoading(true);
    await supabase.from('statuses').insert({
      name: newStatus.name.trim(),
      color: newStatus.color,
      order: newStatus.order,
      created_by: userId,
    });
    setLoading(false);
    setOpen(false);
    setNewStatus({ name: '', color: DEFAULT_COLORS[0], order: statuses.length + 1 });
    router.refresh();
  };

  const handleDelete = async (id: string, isSystem: boolean) => {
    if (isSystem) return;
    if (!confirm('Bu durumu silmek istediğinize emin misiniz?')) return;
    await supabase.from('statuses').delete().eq('id', id);
    router.refresh();
  };

  const handleSetDefault = async (id: string) => {
    await supabase.from('statuses').update({ is_default: false }).eq('created_by', userId);
    await supabase.from('statuses').update({ is_default: true }).eq('id', id);
    router.refresh();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' } }}>Durumlar</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { setNewStatus({ ...newStatus, order: statuses.length + 1 }); setOpen(true); }}
          fullWidth={isMobile}
        >
          Yeni Durum
        </Button>
      </Box>

      <Stack spacing={1.5}>
        {statuses.map((s) => (
          <Card key={s.id}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{s.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Sıra: {s.order}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  {s.is_default && <Chip size="small" label="Varsayılan" color="success" />}
                  {s.is_system && <Chip size="small" label="Sistem" variant="outlined" />}
                  {!s.is_system && (
                    <>
                      <Button size="small" onClick={() => handleSetDefault(s.id)} disabled={s.is_default}>
                        Varsayılan Yap
                      </Button>
                      <IconButton size="small" color="error" onClick={() => handleDelete(s.id, s.is_system)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {statuses.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Rule sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>Durum bulunamadı</Typography>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Yeni Durum</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Durum Adı" fullWidth value={newStatus.name} onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })} sx={{ mt: 1 }} />
          <TextField label="Sıra" type="number" fullWidth value={newStatus.order} onChange={(e) => setNewStatus({ ...newStatus, order: parseInt(e.target.value) || 0 })} />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {DEFAULT_COLORS.map((color) => (
              <Box
                key={color}
                onClick={() => setNewStatus({ ...newStatus, color })}
                sx={{
                  width: 32, height: 32, borderRadius: '50%', bgcolor: color, cursor: 'pointer',
                  border: newStatus.color === color ? '3px solid #fff' : '3px solid transparent',
                  boxShadow: newStatus.color === color ? `0 0 0 2px ${color}` : 'none',
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading || !newStatus.name.trim()}>Ekle</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
