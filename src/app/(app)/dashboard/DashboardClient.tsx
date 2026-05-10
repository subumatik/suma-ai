'use client';

import { useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, Button, Chip, Avatar, Grid, Paper, Stack, useMediaQuery, useTheme } from '@mui/material';
import {
  Folder, CalendarMonth, Chat, People, CheckCircle, Schedule,
  ArrowForward, Gavel, Notifications,
} from '@mui/icons-material';
import { PieChart } from '@mui/x-charts/PieChart';

interface DashboardClientProps {
  role: string;
  profile: any;
  dosyalar: any[];
  appointments: any[];
  hearings: any[];
  unreadMessages: number;
  totalUsers: number;
  totalDosyalar: number;
  categories: any[];
  statuses: any[];
}

export default function DashboardClient({ role, profile, dosyalar, appointments, hearings, unreadMessages, totalUsers, totalDosyalar, categories, statuses }: DashboardClientProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const chartWidth = isMobile ? 320 : 400;
  const chartHeight = isMobile ? 240 : 280;

  const isLawyer = role === 'lawyer';
  const isAdmin = role === 'admin';

  const activeDosyalar = dosyalar.filter((d) => d.status?.name !== 'Tamamlandı' && d.status?.name !== 'Kapandı').length;

  const stats = isAdmin
    ? [
        { label: 'Toplam Kullanıcı', value: totalUsers, icon: <People />, color: '#3B82F6', bg: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)' },
        { label: 'Toplam Dosya', value: totalDosyalar, icon: <Folder />, color: '#C9A227', bg: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)' },
        { label: 'Aktif Dosya', value: activeDosyalar, icon: <CheckCircle />, color: '#10B981', bg: 'linear-gradient(135deg, #10B981 0%, #047857 100%)' },
      ]
    : [
        { label: isLawyer ? 'Toplam Dosya' : 'Dosyalarım', value: dosyalar.length, icon: <Folder />, color: '#3B82F6', bg: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)' },
        { label: 'Aktif Dosya', value: activeDosyalar, icon: <CheckCircle />, color: '#10B981', bg: 'linear-gradient(135deg, #10B981 0%, #047857 100%)' },
        { label: 'Yaklaşan Randevu', value: appointments.length + hearings.length, icon: <CalendarMonth />, color: '#C9A227', bg: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)' },
        { label: 'Okunmamış Mesaj', value: unreadMessages, icon: <Chat />, color: '#EF4444', bg: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)' },
      ];

  // Kategori dağılımı
  const catCounts: Record<string, number> = {};
  dosyalar.forEach((d) => {
    const name = d.category?.name ?? 'Kategorisiz';
    catCounts[name] = (catCounts[name] ?? 0) + 1;
  });

  // Durum dağılımı
  const statusCounts: Record<string, number> = {};
  dosyalar.forEach((d) => {
    const name = d.status?.name ?? 'Bilinmiyor';
    statusCounts[name] = (statusCounts[name] ?? 0) + 1;
  });

  const catChartData = Object.entries(catCounts).map(([name, count], idx) => {
    const cat = categories.find((c) => c.name === name);
    return { id: idx, value: count, label: name, color: cat?.color ?? '#3B82F6' };
  });

  const statusChartData = Object.entries(statusCounts).map(([name, count], idx) => {
    const st = statuses.find((s) => s.name === name);
    return { id: idx, value: count, label: name, color: st?.color ?? '#3B82F6' };
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Welcome Banner */}
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2C5282 100%)',
          color: '#fff',
          boxShadow: '0 10px 40px rgba(30,58,95,0.25)',
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
          Hoş Geldiniz, {profile?.full_name ?? 'Kullanıcı'}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 600 }}>
          {isLawyer
            ? 'Avukat panelinizden dosyalarınızı, müvekkillerinizi ve randevularınızı kolayca yönetebilirsiniz.'
            : isAdmin
            ? 'Sistem yönetim paneline hoş geldiniz. Genel istatistikleri buradan takip edebilirsiniz.'
            : 'Dosyalarınızı takip edebilir, avukatınızla iletişim kurabilir ve randevularınızı görüntüleyebilirsiniz.'}
        </Typography>
      </Paper>

      {/* Stats */}
      <Grid container spacing={3}>
        {stats.map((s) => (
          <Grid size={{ xs: 12, sm: 6, lg: isAdmin ? 4 : 3 }} key={s.label}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.1)' },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  <Avatar sx={{ background: s.bg, color: '#fff', width: 56, height: 56, fontSize: 28 }}>
                    {s.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, mb: 0.5 }}>
                      {s.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {s.label}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Lists */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3, boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Son Dosyalar</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Son güncellenen dosya kayıtları</Typography>
                </Box>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => router.push('/cases')}>
                  Tümünü Gör
                </Button>
              </Box>
              {dosyalar.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Folder sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Henüz dosya bulunmuyor.</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {dosyalar.map((d) => (
                    <Paper
                      key={d.id}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                      }}
                      onClick={() => router.push(`/cases/${d.id}`)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                          {d.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={d.status?.name ?? '-'}
                          sx={{
                            bgcolor: (d.status?.color ?? '#3B82F6') + '15',
                            color: d.status?.color ?? '#3B82F6',
                            fontWeight: 600,
                            borderRadius: 1,
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Gavel fontSize="inherit" /> {d.file_number ?? 'Belirtilmemiş'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <People fontSize="inherit" /> {(() => {
                            const dosyaLawyers = (d.lawyers ?? []).map((l: any) => l.lawyer).filter(Boolean);
                            const dosyaClients = (d.clients ?? []).map((c: any) => c.client).filter(Boolean);
                            const targetList = isLawyer ? dosyaClients : dosyaLawyers;
                            return targetList.map((p: any) => p.full_name).filter(Boolean).join(', ') || '-';
                          })()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Folder fontSize="inherit" /> {d.category?.name ?? 'Kategorisiz'}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Yaklaşan Randevular & Duruşmalar</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Önümüzdeki randevu ve duruşma planları</Typography>
                </Box>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => router.push('/appointments')}>
                  Tümünü Gör
                </Button>
              </Box>
              {appointments.length === 0 && hearings.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <CalendarMonth sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Henüz randevu veya duruşma bulunmuyor.</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {[
                    ...appointments.map((a) => ({ ...a, kind: 'appointment' as const })),
                    ...hearings.map((h) => ({ ...h, kind: 'hearing' as const })),
                  ]
                    .sort((a: any, b: any) => new Date(a.appointment_date || a.hearing_date).getTime() - new Date(b.appointment_date || b.hearing_date).getTime())
                    .slice(0, 5)
                    .map((item: any) => {
                      if (item.kind === 'hearing') {
                        return (
                          <Paper
                            key={`hearing-${item.id}`}
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: 2,
                              bgcolor: 'background.paper',
                              border: '1px solid',
                              borderColor: 'divider',
                              cursor: 'pointer',
                            }}
                            onClick={() => router.push(`/cases/${item.dosya_id}`)}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {item.dosya?.title ?? 'Duruşma'}
                              </Typography>
                              <Chip size="small" label="Duruşma" color="secondary" sx={{ fontWeight: 600, borderRadius: 1 }} />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Gavel sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {item.court_name || 'Mahkeme belirtilmemiş'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {new Date(item.hearing_date).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
                              </Typography>
                            </Box>
                          </Paper>
                        );
                      }
                      const stMap: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
                        REQUESTED: { label: 'Talep Edildi', color: 'warning' },
                        CONFIRMED: { label: 'Onaylandı', color: 'success' },
                        CANCELLED: { label: 'İptal', color: 'error' },
                        COMPLETED: { label: 'Tamamlandı', color: 'info' },
                      };
                      const st = stMap[item.status] ?? { label: item.status, color: 'default' };
                      return (
                        <Paper
                          key={item.id}
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {item.topic ?? 'Randevu'}
                            </Typography>
                            <Chip size="small" label={st.label} color={st.color} sx={{ fontWeight: 600, borderRadius: 1 }} />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {new Date(item.appointment_date).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
                            </Typography>
                          </Box>
                        </Paper>
                      );
                    })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Kategori Dağılımı</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Dosyaların kategorilere göre dağılımı
              </Typography>
              {catChartData.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Folder sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Henüz veri yok.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <PieChart
                    series={[
                      {
                        data: catChartData,
                        innerRadius: 60,
                        paddingAngle: 2,
                        cornerRadius: 4,
                      },
                    ]}
                    width={chartWidth}
                    height={chartHeight}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Durum Dağılımı</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Dosyaların mevcut durumlarına göre dağılımı
              </Typography>
              {statusChartData.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Notifications sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Henüz veri yok.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <PieChart
                    series={[
                      {
                        data: statusChartData,
                        innerRadius: 60,
                        paddingAngle: 2,
                        cornerRadius: 4,
                      },
                    ]}
                    width={chartWidth}
                    height={chartHeight}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
