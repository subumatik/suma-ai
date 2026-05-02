'use client';

import { Box, Typography, Grid, Card, CardContent, LinearProgress } from '@mui/material';

interface Props {
  totalAnalyses: number
  completedCount: number
  avgMiteCount: number
  avgConfidence: number
  ageGroups: Record<string, number>
  genderDist: Record<string, number>
}

export default function StatsClient({
  totalAnalyses,
  completedCount,
  avgMiteCount,
  avgConfidence,
  ageGroups,
  genderDist,
}: Props) {
  const successRate = totalAnalyses > 0 ? Math.round((completedCount / totalAnalyses) * 100) : 0

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Detaylı İstatistikler</Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Başarı Oranı</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>%{successRate}</Typography>
              <LinearProgress variant="determinate" value={successRate} sx={{ mt: 1, height: 8, borderRadius: 4 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Ortalama Akar</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{avgMiteCount.toFixed(1)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Ortalama Güven</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>%{Math.round(avgConfidence * 100)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Tamamlanan</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{completedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Yaş Dağılımı</Typography>
              {Object.entries(ageGroups).map(([group, count]) => (
                <Box key={group} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{group}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{count}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.max(1, (count / Math.max(...Object.values(ageGroups))) * 100)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Cinsiyet Dağılımı</Typography>
              {Object.entries(genderDist).map(([gender, count]) => (
                <Box key={gender} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{gender}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{count}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.max(1, (count / Math.max(...Object.values(genderDist))) * 100)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
