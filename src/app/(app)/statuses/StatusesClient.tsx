'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Card, CardContent, Typography, Button, TextField, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, Switch, FormControlLabel,
} from '@mui/material';
import { Add, Delete, DragIndicator, Rule } from '@mui/icons-material';

const DEFAULT_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#6B7280'];

interface StatusesClientProps {
  statuses: any[];
  userId: string;
}

export default function StatusesClient({ statuses, userId }: StatusesClientProps) {
  const router = useRouter();
  const supabase = createClient();
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Durumlar</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setNewStatus({ ...newStatus, order: statuses.length + 1 }); setOpen(true); }}>Yeni Durum</Button>
      </Box>

      <Card>
        <List>
          {statuses.map((s, index) => (
            <ListItem key={s.id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <DragIndicator sx={{ color: 'text.secondary', mr: 1 }} />
              <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: s.color, mr: 2 }} />
              <ListItemText primary={s.name} secondary={`Sıra: ${s.order}`} />
              {s.is_default && <Chip size="small" label="Varsayılan" color="success" sx={{ mr: 1 }} />}
              {s.is_system && <Chip size="small" label="Sistem" variant="outlined" sx={{ mr: 1 }} />}
              {!s.is_system && (
                <>
                  <Button size="small" onClick={() => handleSetDefault(s.id)} disabled={s.is_default}>Varsayılan Yap</Button>
                  <IconButton size="small" color="error" onClick={() => handleDelete(s.id, s.is_system)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </>
              )}
            </ListItem>
          ))}
        </List>
      </Card>

      {statuses.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Rule sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>Durum bulunamadı</Typography>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Yeni Durum</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Durum Adı" fullWidth value={newStatus.name} onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })} />
          <TextField label="Sıra" type="number" fullWidth value={newStatus.order} onChange={(e) => setNewStatus({ ...newStatus, order: parseInt(e.target.value) || 0 })} />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {DEFAULT_COLORS.map((color) => (
              <Box key={color} onClick={() => setNewStatus({ ...newStatus, color })}
                sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: color, cursor: 'pointer',
                  border: newStatus.color === color ? '3px solid #fff' : '3px solid transparent',
                  boxShadow: newStatus.color === color ? `0 0 0 2px ${color}` : 'none',
                }} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading || !newStatus.name.trim()}>Ekle</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
