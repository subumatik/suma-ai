'use client';

import { useState } from 'react';
import {
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  Fade,
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Visibility, VisibilityOff, Balance, Person } from '@mui/icons-material';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: (email: string, password: string) => void;
}

export default function RegisterForm({ onSwitchToLogin, onRegisterSuccess }: RegisterFormProps) {
  const [userType, setUserType] = useState<'client' | 'lawyer'>('client');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [baroNumber, setBaroNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [referansKodu, setReferansKodu] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!email || !password || !fullName) {
      setError('Ad soyad, e-posta ve şifre zorunludur');
      return;
    }
    if (userType === 'lawyer' && !baroNumber) {
      setError('Avukatlar için baro numarası zorunludur');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
          userType,
          baroNumber,
          specialization,
          referansKodu,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Kayıt başarısız');
        setLoading(false);
        return;
      }

      onRegisterSuccess(email, password);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const shrinkProps = { inputLabel: { shrink: true } };

  return (
    <>
      <Fade in={!!error}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Fade>

      <ToggleButtonGroup
        value={userType}
        exclusive
        onChange={(_, v) => v && setUserType(v)}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="client">
          <Person sx={{ mr: 1, fontSize: 18 }} /> Müvekkil
        </ToggleButton>
        <ToggleButton value="lawyer">
          <Balance sx={{ mr: 1, fontSize: 18 }} /> Avukat
        </ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField
          label="Ad Soyad"
          fullWidth
          size="small"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          slotProps={shrinkProps}
        />
        <TextField
          label="E-posta"
          type="email"
          fullWidth
          size="small"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          slotProps={shrinkProps}
        />
        <TextField
          label="Telefon"
          fullWidth
          size="small"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          slotProps={shrinkProps}
        />

        {userType === 'lawyer' && (
          <>
            <TextField
              label="Baro Numarası"
              fullWidth
              size="small"
              value={baroNumber}
              onChange={(e) => setBaroNumber(e.target.value)}
              slotProps={shrinkProps}
            />
            <TextField
              label="Uzmanlık Alanı"
              fullWidth
              size="small"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              slotProps={shrinkProps}
            />
            <Alert severity="info" sx={{ fontSize: 12 }}>
              Kayıt sonrası size özel bir referans kodu otomatik oluşturulacaktır.
            </Alert>
          </>
        )}

        {userType === 'client' && (
          <TextField
            label="Avukat Referans Kodu"
            fullWidth
            size="small"
            value={referansKodu}
            onChange={(e) => setReferansKodu(e.target.value)}
            helperText="Birden fazla kod için virgülle ayırın (örn: ABC123, DEF456)"
            slotProps={shrinkProps}
          />
        )}

        <TextField
          label="Şifre"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          size="small"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: 'text.secondary' }}
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleRegister}
        disabled={loading}
        sx={{ mt: 2, py: 1.5 }}
      >
        {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
      </Button>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button onClick={onSwitchToLogin} sx={{ textTransform: 'none' }}>
          Zaten hesabınız var mı? Giriş yapın
        </Button>
      </Box>
    </>
  );
}
