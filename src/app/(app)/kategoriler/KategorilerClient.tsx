'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Card, CardContent, Typography, Button, TextField, Chip,
  List, ListItem, ListItemText, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid,
} from '@mui/material';
import { Add, Delete, Category } from '@mui/icons-material';

const DEFAULT_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

interface KategorilerClientProps {
  categories: any[];
  userId: string;
}

export default function KategorilerClient({ categories, userId }: KategorilerClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', color: DEFAULT_COLORS[0] });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!newCat.name.trim()) return;
    setLoading(true);
    await supabase.from('categories').insert({
      name: newCat.name.trim(),
      color: newCat.color,
      created_by: userId,
    });
    setLoading(false);
    setOpen(false);
    setNewCat({ name: '', color: DEFAULT_COLORS[0] });
    router.refresh();
  };

  const handleDelete = async (id: string, isSystem: boolean) => {
    if (isSystem) return;
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
    await supabase.from('categories').delete().eq('id', id);
    router.refresh();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Kategoriler</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Yeni Kategori</Button>
      </Box>

      <Grid container spacing={2}>
        {categories.map((c) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={c.id}>
            <Card>
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Category sx={{ color: c.color }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                </Box>
                {!c.is_system && (
                  <IconButton size="small" color="error" onClick={() => handleDelete(c.id, c.is_system)}>
                    <Delete fontSize="small" />
                  </IconButton>
                )}
                {c.is_system && <Chip size="small" label="Sistem" variant="outlined" />}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {categories.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Category sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>Kategori bulunamadı</Typography>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Yeni Kategori</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Kategori Adı" fullWidth value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {DEFAULT_COLORS.map((color) => (
              <Box
                key={color}
                onClick={() => setNewCat({ ...newCat, color })}
                sx={{
                  width: 32, height: 32, borderRadius: '50%', bgcolor: color, cursor: 'pointer',
                  border: newCat.color === color ? '3px solid #fff' : '3px solid transparent',
                  boxShadow: newCat.color === color ? `0 0 0 2px ${color}` : 'none',
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading || !newCat.name.trim()}>Ekle</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
