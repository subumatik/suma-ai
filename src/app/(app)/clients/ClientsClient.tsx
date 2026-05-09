'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, TextField, Grid,
  Avatar, InputAdornment, IconButton,
} from '@mui/material';
import { People, Search, Mail, Phone, ContentCopy } from '@mui/icons-material';

interface ClientsClientProps {
  clients: any[];
  role: string;
  referansKodu: string | null;
}

export default function ClientsClient({ clients, role, referansKodu }: ClientsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  const handleCopy = () => {
    if (referansKodu) {
      navigator.clipboard.writeText(referansKodu);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' } }}>Müvekkillerim</Typography>
      </Box>

      {role === 'lawyer' && referansKodu && (
        <Card sx={{ mb: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Referans Kodunuz
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Müvekkilleriniz bu kodu kayıt olurken girerek sizi seçebilir.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: 'primary.dark',
                  bgcolor: '#fff',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: 'primary.main',
                }}
              >
                {referansKodu}
              </Typography>
              <IconButton onClick={handleCopy} color="primary" size="small" title="Kopyala">
                <ContentCopy fontSize="small" />
              </IconButton>
              {copied && (
                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 500 }}>
                  Kopyalandı!
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      <TextField
        placeholder="Müvekkil ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Grid container spacing={2}>
        {filtered.map((c) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={c.id}>
            <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => router.push(`/messages?u=${c.id}`)}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.dark', width: 56, height: 56, fontSize: 20, fontWeight: 700 }}>
                    {(c.full_name?.charAt(0) ?? 'M').toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{c.full_name ?? 'İsimsiz'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Müvekkil</Typography>
                  </Box>
                </Box>
                {c.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Mail sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{c.email}</Typography>
                  </Box>
                )}
                {c.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{c.phone}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <People sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>Müvekkil bulunamadı</Typography>
        </Box>
      )}
    </Box>
  );
}
