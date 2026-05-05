import { Box, Skeleton, Card, CardContent } from '@mui/material';

export default function DashboardLoading() {
  return (
    <Box>
      <Skeleton variant="text" width={400} height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={500} height={24} sx={{ mb: 4 }} />
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} sx={{ flex: 1 }}>
            <CardContent sx={{ p: 3 }}>
              <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="80%" height={20} />
            </CardContent>
          </Card>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ p: 3, minHeight: 300 }}>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 1 }} />
            ))}
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ p: 3, minHeight: 300 }}>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 1 }} />
            ))}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
