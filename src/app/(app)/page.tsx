'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, Button, Chip, Skeleton, Grid } from '@mui/material';
import { People, Biotech, Speed, NotificationsActive, TrendingUp, TrendingDown, CalendarToday, ArrowForward } from '@mui/icons-material';

function uid() { return Math.random().toString(36).slice(2); }

const mockStats = { totalPatients: 1247, totalAnalyses: 3892, avgConfidence: 0.87, pendingReviews: 7 };
const mockAnalyses = [
  { id: 'a1', patientHash: 'a7f3c8e2d4b1', status: 'Tamamlandı', type: 'Mikroskobik', date: '2 saat önce', confidence: 0.91 },
  { id: 'a2', patientHash: 'b9e1a5f7c3d8', status: 'İşleniyor', type: 'Dermoskopik', date: '3 saat önce', confidence: 0 },
  { id: 'a3', patientHash: 'c4d2e8a1b6f9', status: 'İncelenmeli', type: 'Klinik', date: 'Dün', confidence: 0.72 },
  { id: 'a4', patientHash: 'd8f5c3e1a7b2', status: 'Tamamlandı', type: 'Mikroskobik', date: 'Dün', confidence: 0.88 },
  { id: 'a5', patientHash: 'e3a9b7d5c2f1', status: 'Hata', type: 'Dermoskopik', date: '2 gün önce', confidence: 0 },
  { id: 'a6', patientHash: 'f6c4e2a8d1b5', status: 'Tamamlandı', type: 'Mikroskobik', date: '3 gün önce', confidence: 0.95 },
];
const volumeData = [42, 56, 48, 72, 65, 58, 84, 91];
const weeklyData = [45, 52, 48, 61, 55, 67, 58, 72];

const statusChip = (status: string) => {
  switch (status) {
    case 'Tamamlandı': return <Chip label={status} size="small" sx={{ bgcolor: 'rgba(93,202,165,0.15)', color: 'success.main', fontWeight: 500 }} />;
    case 'İşleniyor': return <Chip label={status} size="small" sx={{ bgcolor: 'rgba(133,183,235,0.15)', color: 'info.main', fontWeight: 500 }} />;
    case 'İncelenmeli': return <Chip label={status} size="small" sx={{ bgcolor: 'rgba(232,168,69,0.15)', color: 'warning.main', fontWeight: 500 }} />;
    case 'Hata': return <Chip label={status} size="small" sx={{ bgcolor: 'rgba(224,112,112,0.15)', color: 'error.main', fontWeight: 500 }} />;
    default: return <Chip label={status} size="small" />;
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 600); }, []);

  const statCards = [
    { label: 'Toplam Hasta', value: mockStats.totalPatients, icon: <People />, color: 'success', trend: 5.2 },
    { label: 'Toplam Analiz', value: mockStats.totalAnalyses, icon: <Biotech />, color: 'info', trend: 8.7 },
    { label: 'Ortalama Güven', value: `%${Math.round(mockStats.avgConfidence * 100)}`, icon: <Speed />, color: 'warning', trend: -1.2 },
    { label: 'Bekleyen İnceleme', value: mockStats.pendingReviews, icon: <NotificationsActive />, color: 'error', trend: null },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Günaydın, Dr. Ahmet</Typography>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <CalendarToday sx={{ fontSize: 16 }} /> {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => router.push('/analiz/yeni')} sx={{ bgcolor: 'primary.dark', color: '#fff', px: 3, '&:hover': { bgcolor: 'primary.main' } }}>
          + Yeni Analiz
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={card.label}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ color: `${card.color}.main` }}>{card.icon}</Box>
                  {card.trend !== null && (
                    <Box sx={{ display: 'flex', alignItems: 'center', color: (card.trend as number) >= 0 ? 'success.main' : 'error.main', fontSize: 13, fontWeight: 500 }}>
                      {(card.trend as number) >= 0 ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
                      {Math.abs(card.trend as number)}%
                    </Box>
                  )}
                </Box>
                {loading ? <Skeleton variant="text" width="60%" height={40} /> : (
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{card.value}</Typography>
                )}
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{card.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: 360 }}>
            <CardContent sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Analiz Hacmi Trendi</Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 260, px: 2 }}>
                {volumeData.map((v, i) => (
                  <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: '100%', bgcolor: 'primary.main', borderRadius: '6px 6px 0 0', opacity: 0.7 + (i / volumeData.length) * 0.3, height: `${(v / 100) * 200}px`, transition: 'height 0.5s' }} />
                    <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>{['1N', '5N', '9N', '13N', '17N', '21N', '25N', '29N'][i]}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: 360 }}>
            <CardContent sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Haftalık Hasta</Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 260, px: 2 }}>
                {weeklyData.map((v, i) => (
                  <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: '100%', bgcolor: i === 4 ? 'primary.main' : 'action.disabledBackground', borderRadius: '6px 6px 0 0', height: `${(v / 80) * 200}px` }} />
                    <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>{['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8'][i]}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Son Analizler</Typography>
            <Button endIcon={<ArrowForward />} sx={{ color: 'primary.main', textTransform: 'none' }}>Tümünü Gör</Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {mockAnalyses.map((a) => (
              <Box key={a.id} onClick={() => router.push(`/report/${a.id}`)}
                sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', flex: 1 }}>{a.patientHash}</Typography>
                <Typography variant="body2" sx={{ width: 90, color: 'text.secondary' }}>{a.type}</Typography>
                <Box sx={{ width: 100 }}>{statusChip(a.status)}</Box>
                <Typography variant="body2" sx={{ width: 80, color: 'text.secondary' }}>{a.date}</Typography>
                <Typography variant="body2" sx={{ width: 50, textAlign: 'right', color: a.confidence >= 0.85 ? 'success.main' : a.confidence >= 0.7 ? 'warning.main' : 'error.main', fontWeight: 600 }}>
                  {a.confidence > 0 ? `%${Math.round(a.confidence * 100)}` : '-'}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
