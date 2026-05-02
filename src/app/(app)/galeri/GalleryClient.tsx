'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Chip, Grid, Card, CardContent, Dialog, IconButton,
} from '@mui/material';
import { Image as ImageIcon, Close } from '@mui/icons-material';

interface GalleryItem {
  id: string;
  image_url: string;
  status: string;
  created_at: string;
  patient_hash: string;
  mite_count: number | null;
  mite_density: string | null;
  confidence_score: number | null;
  category: string;
}

const categories = [
  { key: 'all', label: 'Tümü' },
  { key: 'demodex', label: 'Demodex' },
  { key: 'healthy', label: 'Sağlıklı' },
  { key: 'processing', label: 'İşleniyor' },
];

export default function GalleryClient({ items }: { items: GalleryItem[] }) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  const filtered = activeFilter === 'all' ? items : items.filter((i) => i.category === activeFilter);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'demodex': return 'error';
      case 'healthy': return 'success';
      case 'processing': return 'warning';
      default: return 'default';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'demodex': return 'Demodex';
      case 'healthy': return 'Sağlıklı';
      case 'processing': return 'İşleniyor';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Galeri</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {filtered.length} görsel
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {categories.map((c) => (
          <Chip
            key={c.key}
            label={c.label}
            onClick={() => setActiveFilter(c.key)}
            color={activeFilter === c.key ? 'primary' : 'default'}
            variant={activeFilter === c.key ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>

      {/* Grid */}
      {filtered.length > 0 ? (
        <Grid container spacing={2}>
          {filtered.map((item) => (
            <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }} key={item.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: '0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                }}
                onClick={() => item.image_url && item.image_url !== 'pending' ? setLightbox(item) : router.push(`/analiz/${item.id}`)}
              >
                <Box sx={{ position: 'relative', pt: '100%', bgcolor: 'action.hover' }}>
                  {item.image_url && item.image_url !== 'pending' ? (
                    <Box
                      component="img"
                      src={item.image_url}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                    </Box>
                  )}
                  <Chip
                    label={getCategoryLabel(item.category)}
                    size="small"
                    color={getCategoryColor(item.category) as any}
                    sx={{ position: 'absolute', top: 8, left: 8, fontWeight: 600 }}
                  />
                </Box>
                <CardContent sx={{ p: 1.5, pt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {item.patient_hash}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {item.mite_count !== null ? `${item.mite_count} akar` : 'Sonuç yok'} · {new Date(item.created_at).toLocaleDateString('tr-TR')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Bu kategoride görsel bulunmuyor.
          </Typography>
        </Box>
      )}

      {/* Lightbox */}
      <Dialog open={Boolean(lightbox)} onClose={() => setLightbox(null)} maxWidth="md" fullWidth>
        {lightbox && (
          <Box sx={{ position: 'relative', bgcolor: 'background.paper' }}>
            <IconButton
              onClick={() => setLightbox(null)}
              sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
            >
              <Close />
            </IconButton>
            <Box
              component="img"
              src={lightbox.image_url}
              sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
            />
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Hasta {lightbox.patient_hash}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {lightbox.mite_count !== null ? `${lightbox.mite_count} akar · ${lightbox.mite_density ?? '-'}` : 'Sonuç bekleniyor'}
                </Typography>
              </Box>
              <Chip
                label="Analizi Görüntüle"
                color="primary"
                onClick={() => { setLightbox(null); router.push(`/analiz/${lightbox.id}`); }}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
