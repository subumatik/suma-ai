'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Box, Card, CardContent, TextField, Button, Typography, IconButton, InputAdornment, Alert, Fade } from '@mui/material';
import { Visibility, VisibilityOff, Science } from '@mui/icons-material';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('E-posta ve şifre gereklidir'); return; }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı' : signInError.message);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(15,110,86,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(24,95,165,0.05) 0%, transparent 50%)' }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, p: 2 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ width: 64, height: 64, borderRadius: '50%', border: 2, borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                <Science sx={{ color: 'primary.main', fontSize: 32 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Demodex AI</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Klinik Analiz Platformu</Typography>
            </Box>
            <Fade in={!!error}><Alert severity="error" sx={{ mb: 2 }}>{error}</Alert></Fade>
            <TextField fullWidth label="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()} sx={{ mb: 2 }} />
            <TextField fullWidth label="Şifre" type={showPassword ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} sx={{ mb: 3 }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }} />
            <Button fullWidth variant="contained" size="large" onClick={handleLogin} disabled={loading}
              sx={{ bgcolor: 'primary.dark', color: '#fff', py: 1.5, '&:hover': { bgcolor: 'primary.main', boxShadow: '0 4px 16px rgba(93,202,165,0.3)' } }}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>KVKK ve GDPR uyumlu · SHA-256 anonimleştirme</Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
