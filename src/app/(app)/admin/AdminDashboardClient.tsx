'use client';

import { useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, Grid, Avatar, Button, Chip } from '@mui/material';
import { People, Folder, CalendarMonth, Chat, Balance, Person, ArrowForward } from '@mui/icons-material';

interface AdminDashboardClientProps {
  stats: {
    totalUsers: number;
    totalCases: number;
    totalAppointments: number;
    totalMessages: number;
    lawyerCount: number;
    clientCount: number;
  };
  recentUsers: any[];
}

export default function AdminDashboardClient({ stats, recentUsers }: AdminDashboardClientProps) {
  const router = useRouter();

  const statCards = [
    { label: 'Toplam Kullanıcı', value: stats.totalUsers, icon: <People />, color: '#3B82F6' },
    { label: 'Toplam Dava', value: stats.totalCases, icon: <Folder />, color: '#C9A227' },
    { label: 'Toplam Randevu', value: stats.totalAppointments, icon: <CalendarMonth />, color: '#10B981' },
    { label: 'Toplam Mesaj', value: stats.totalMessages, icon: <Chat />, color: '#EF4444' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, fontSize: { xs: '1.5rem', md: '2rem' } }}>Yönetim Paneli</Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((s) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s.label}>
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: `${s.color}20`, color: s.color, width: 48, height: 48 }}>{s.icon}</Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' } }}>{s.value}</Typography>
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
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Kullanıcı Dağılımı</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: 'action.hover', textAlign: 'center' }}>
                  <Balance sx={{ color: 'primary.main', mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.lawyerCount}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Avukat</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: 'action.hover', textAlign: 'center' }}>
                  <Person sx={{ color: 'secondary.main', mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.clientCount}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Müvekkil</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Son Kullanıcılar</Typography>
                <Button size="small" onClick={() => router.push('/admin/kullanicilar')}>Tümünü Gör</Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {recentUsers.map((u) => (
                  <Box key={u.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.full_name ?? 'İsimsiz'}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{u.email ?? ''}</Typography>
                    </Box>
                    <Chip size="small" label={u.role === 'lawyer' ? 'Avukat' : u.role === 'admin' ? 'Admin' : 'Müvekkil'} color={u.role === 'lawyer' ? 'primary' : u.role === 'admin' ? 'error' : 'default'} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
