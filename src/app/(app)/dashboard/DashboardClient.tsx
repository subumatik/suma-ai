'use client';

import { useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, Button, Chip, Avatar, Grid } from '@mui/material';
import {
  Folder, CalendarMonth, Chat, People, CheckCircle, Pending, Schedule,
} from '@mui/icons-material';

interface DashboardClientProps {
  role: string;
  profile: any;
  dosyalar: any[];
  appointments: any[];
  unreadMessages: number;
  totalUsers: number;
  totalDosyalar: number;
  categories: any[];
  statuses: any[];
}

export default function DashboardClient({ role, profile, dosyalar, appointments, unreadMessages, totalUsers, totalDosyalar, categories, statuses }: DashboardClientProps) {
  const router = useRouter();

  const isLawyer = role === 'lawyer';
  const isAdmin = role === 'admin';

  const activeDosyalar = dosyalar.filter((d) => d.status?.name !== 'Tamamlandı' && d.status?.name !== 'Kapandı').length;

  const stats = isAdmin
    ? [
        { label: 'Toplam Kullanıcı', value: totalUsers, icon: <People />, color: '#3B82F6' },
        { label: 'Toplam Dosya', value: totalDosyalar, icon: <Folder />, color: '#C9A227' },
        { label: 'Aktif Dosya', value: activeDosyalar, icon: <CheckCircle />, color: '#10B981' },
      ]
    : [
        { label: isLawyer ? 'Toplam Dosya' : 'Dosyalarım', value: dosyalar.length, icon: <Folder />, color: '#3B82F6' },
        { label: 'Aktif Dosya', value: activeDosyalar, icon: <CheckCircle />, color: '#10B981' },
        { label: 'Yaklaşan Randevu', value: appointments.length, icon: <CalendarMonth />, color: '#C9A227' },
        { label: 'Okunmamış Mesaj', value: unreadMessages, icon: <Chat />, color: '#EF4444' },
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

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Hoş Geldiniz, {profile?.full_name ?? 'Kullanıcı'}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {isLawyer ? 'Avukat panelinizden dosyalarınızı ve müvekkillerinizi yönetebilirsiniz.' :
           isAdmin ? 'Sistem yönetim paneline hoş geldiniz.' :
           'Dosyalarınızı takip edebilir ve avukatınızla iletişim kurabilirsiniz.'}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((s) => (
          <Grid size={{ xs: 12, sm: 6, md: 6, lg: isAdmin ? 4 : 3 }} key={s.label}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: `${s.color}20`, color: s.color, width: 48, height: 48 }}>{s.icon}</Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{s.value}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{s.label}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Son Dosyalar</Typography>
                <Button size="small" onClick={() => router.push('/cases')}>Tümünü Gör</Button>
              </Box>
              {dosyalar.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>Henüz dosya bulunmuyor.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {dosyalar.map((d) => (
                    <Box key={d.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', cursor: 'pointer' }} onClick={() => router.push(`/cases/${d.id}`)}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{d.title}</Typography>
                        <Chip size="small" label={d.status?.name ?? '-'} sx={{ bgcolor: d.status?.color + '20', color: d.status?.color }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {d.file_number ?? 'Dosya No: Belirtilmemiş'} · {d.category?.name ?? 'Kategorisiz'} · {isLawyer ? d.client?.full_name : d.lawyer?.full_name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Yaklaşan Randevular</Typography>
                <Button size="small" onClick={() => router.push('/appointments')}>Tümünü Gör</Button>
              </Box>
              {appointments.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>Henüz randevu bulunmuyor.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {appointments.map((a) => {
                    const stMap: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
                      REQUESTED: { label: 'Talep Edildi', color: 'warning' },
                      CONFIRMED: { label: 'Onaylandı', color: 'success' },
                      CANCELLED: { label: 'İptal', color: 'error' },
                      COMPLETED: { label: 'Tamamlandı', color: 'info' },
                    };
                    const st = stMap[a.status] ?? { label: a.status, color: 'default' };
                    return (
                      <Box key={a.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{a.topic ?? 'Randevu'}</Typography>
                          <Chip size="small" label={st.label} color={st.color} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {new Date(a.appointment_date).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Kategori ve Durum Dağılımı */}
      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Kategori Dağılımı</Typography>
              {Object.keys(catCounts).length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Henüz veri yok.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(catCounts).map(([name, count]) => {
                    const cat = categories.find((c) => c.name === name);
                    return (
                      <Chip key={name} label={`${name}: ${count}`} sx={{ bgcolor: (cat?.color ?? '#3B82F6') + '20', color: cat?.color ?? '#3B82F6' }} />
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Durum Dağılımı</Typography>
              {Object.keys(statusCounts).length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Henüz veri yok.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(statusCounts).map(([name, count]) => {
                    const st = statuses.find((s) => s.name === name);
                    return (
                      <Chip key={name} label={`${name}: ${count}`} sx={{ bgcolor: (st?.color ?? '#3B82F6') + '20', color: st?.color ?? '#3B82F6' }} />
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
