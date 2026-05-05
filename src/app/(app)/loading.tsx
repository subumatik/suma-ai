import { Box, Skeleton, Card, CardContent } from '@mui/material';

export default function Loading() {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width={300} height={48} sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ p: 3, minHeight: 300 }}>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
