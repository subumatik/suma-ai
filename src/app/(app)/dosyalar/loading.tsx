import { Box, Skeleton, Card, CardContent } from '@mui/material';

export default function DosyalarLoading() {
  return (
    <Box>
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
      <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2, mb: 3 }} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} sx={{ width: { xs: '100%', md: 'calc(50% - 8px)', lg: 'calc(33.33% - 11px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Skeleton variant="text" width="70%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="50%" height={16} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
