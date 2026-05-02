'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Grid, Card, CardContent, Button,
} from '@mui/material';
import {
  People, Science, Assessment, TrendingUp,
  BugReport, HealthAndSafety, CloudUpload,
} from '@mui/icons-material';

interface Stats {
  totalUsers: number
  totalPatients: number
  totalAnalyses: number
  totalReports: number
  demodexCount: number
  healthyCount: number
}

interface Analysis {
  id: string
  status: string
  created_at: string
  patients: { anonymous_hash: string } | null
  analysis_results: { mite_count: number | null; confidence_score: number | null }[] | null
}

export default function AdminDashboardClient({ stats, recentAnalyses }: { stats: Stats; recentAnalyses: Analysis[] }) {
  const router = useRouter()
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')

  const handleSeed = async () => {
    if (!confirm('Dummy veriler eklenecek. Emin misiniz?')) return
    setSeedLoading(true)
    setSeedMsg('')
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setSeedMsg(`Eklendi: ${data.stats.patients} hasta, ${data.stats.analyses} analiz, ${data.stats.results} sonuç`)
        router.refresh()
      } else {
        setSeedMsg('Hata: ' + data.error)
      }
    } catch {
      setSeedMsg('Bir hata oluştu')
    }
    setSeedLoading(false)
  }

  const statCards = [
    { title: 'Kullanıcılar', value: stats.totalUsers, icon: People, color: 'primary' as const },
    { title: 'Hastalar', value: stats.totalPatients, icon: Science, color: 'secondary' as const },
    { title: 'Analizler', value: stats.totalAnalyses, icon: Assessment, color: 'info' as const },
    { title: 'Raporlar', value: stats.totalReports, icon: TrendingUp, color: 'success' as const },
    { title: 'Demodex', value: stats.demodexCount, icon: BugReport, color: 'error' as const },
    { title: 'Sağlıklı', value: stats.healthyCount, icon: HealthAndSafety, color: 'success' as const },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Admin Paneli</Typography>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={handleSeed}
          disabled={seedLoading}
        >
          {seedLoading ? 'Yükleniyor...' : 'Dummy Veri Ekle'}
        </Button>
      </Box>

      {seedMsg && (
        <Typography variant="body2" sx={{ mb: 2, color: seedMsg.startsWith('Hata') ? 'error.main' : 'success.main' }}>
          {seedMsg}
        </Typography>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={stat.title}>
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
          )
        })}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Son Analizler</Typography>
              {recentAnalyses.map((a) => (
                <Box key={a.id} sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Hasta {a.patients?.anonymous_hash ?? a.id.slice(0, 8)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {a.status} · {a.analysis_results?.[0]?.mite_count ?? '-'} akar
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Hızlı Erişim</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="outlined" onClick={() => router.push('/admin/kullanicilar')}>
                  Kullanıcıları Yönet
                </Button>
                <Button variant="outlined" onClick={() => router.push('/admin/istatistikler')}>
                  Detaylı İstatistikler
                </Button>
                <Button variant="outlined" onClick={() => router.push('/patients')}>
                  Hasta Listesi
                </Button>
                <Button variant="outlined" onClick={() => router.push('/galeri')}>
                  Galeri
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
