'use client';

import { Box, Typography, Paper, Grid, Card, CardContent, LinearProgress } from '@mui/material';
import {
  Science as ScienceIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

interface RecentAnalysis {
  id: string;
  status: string;
  created_at: string;
  patients: { anonymous_hash: string } | null;
  analysis_results: { mite_count: number | null; confidence_score: number | null }[] | null;
}

interface Stats {
  totalAnalyses: number;
  activePatients: number;
  thisMonthReports: number;
  successRate: number;
}

export default function DashboardClient({ stats, recentAnalyses }: { stats: Stats; recentAnalyses: RecentAnalysis[] }) {
  const statCards = [
    { title: 'Toplam Analiz', value: stats.totalAnalyses.toString(), icon: ScienceIcon, color: 'primary' as const },
    { title: 'Aktif Hastalar', value: stats.activePatients.toString(), icon: PeopleIcon, color: 'secondary' as const },
    { title: 'Bu Ay Rapor', value: stats.thisMonthReports.toString(), icon: AssessmentIcon, color: 'info' as const },
    { title: 'Başarı Oranı', value: `%${stats.successRate}`, icon: TrendingUpIcon, color: 'success' as const },
  ];

  const getSeverity = (miteCount: number | null) => {
    if (miteCount === null) return { label: 'Bekleniyor', color: 'text.secondary' as const };
    if (miteCount === 0) return { label: 'Negatif', color: 'success.main' as const };
    if (miteCount <= 3) return { label: 'Hafif', color: 'warning.main' as const };
    return { label: 'Ağır', color: 'error.main' as const };
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Dashboard</Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.title}>
              <Card elevation={2} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${stat.color}.main`, color: `${stat.color}.contrastText` }}>
                      <Icon sx={{ fontSize: 24 }} />
                    </Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{stat.value}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{stat.title}</Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Son Analizler</Typography>
            {recentAnalyses.map((analysis, idx) => {
              const result = analysis.analysis_results?.[0];
              const severity = getSeverity(result?.mite_count ?? null);
              return (
                <Box key={analysis.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Hasta {analysis.patients?.anonymous_hash ?? analysis.id.slice(0, 8)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {new Date(analysis.created_at).toLocaleDateString('tr-TR')}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: severity.color }}>
                        {severity.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {analysis.status}
                      </Typography>
                    </Box>
                  </Box>
                  {idx < recentAnalyses.length - 1 && <Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}
                </Box>
              );
            })}
            {recentAnalyses.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
                Henüz analiz bulunmuyor.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Sistem Durumu</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { label: 'AI Model', value: 98, status: 'Aktif' },
                { label: 'Görüntü İşleme', value: 95, status: 'Aktif' },
                { label: 'Veritabanı', value: 100, status: 'Bağlı' },
              ].map((item) => (
                <Box key={item.label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>{item.status}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={item.value} color="success" sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
