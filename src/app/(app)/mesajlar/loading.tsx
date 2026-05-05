import { Box, Skeleton, Card, CardContent } from '@mui/material';

export default function MesajlarLoading() {
  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', gap: 2 }}>
      <Card sx={{ width: 320, flexShrink: 0 }}>
        <CardContent sx={{ p: 2 }}>
          <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={56} sx={{ borderRadius: 2, mb: 1 }} />
          ))}
        </CardContent>
      </Card>
      <Card sx={{ flex: 1 }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    </Box>
  );
}
