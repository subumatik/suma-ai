'use client';

import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { ErrorOutlined } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function AuthCodeErrorPage() {
  const router = useRouter();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <CardContent sx={{ p: 4 }}>
          <ErrorOutlined sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Doğrulama Başarısız
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            E-posta doğrulama bağlantısı geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapmayı deneyin veya yeni bir doğrulama e-postası talep edin.
          </Typography>
          <Button variant="contained" fullWidth onClick={() => router.push('/login')}>
            Giriş Sayfasına Dön
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
