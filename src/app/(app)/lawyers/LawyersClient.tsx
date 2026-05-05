'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  Avatar, Chip, InputAdornment,
} from '@mui/material';
import { Person, Search, CalendarMonth, Mail, Phone, Balance } from '@mui/icons-material';

interface LawyersClientProps {
  lawyers: any[];
  userId: string;
}

export default function LawyersClient({ lawyers, userId }: LawyersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = lawyers.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.full_name?.toLowerCase().includes(q) ||
      l.specialization?.toLowerCase().includes(q) ||
      l.baro_number?.toLowerCase().includes(q)
    );
  });

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Avukatlar</Typography>

      <TextField
        placeholder="Avukat ara..."
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
        {filtered.map((l) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={l.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.dark', width: 56, height: 56, fontSize: 20, fontWeight: 700 }}>
                    {(l.full_name?.charAt(0) ?? 'A').toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{l.full_name}</Typography>
                    {l.specialization && (
                      <Chip size="small" label={l.specialization} color="primary" variant="outlined" />
                    )}
                  </Box>
                </Box>

                {l.baro_number && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Balance sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Baro No: {l.baro_number}</Typography>
                  </Box>
                )}
                {l.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Mail sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{l.email}</Typography>
                  </Box>
                )}
                {l.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{l.phone}</Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" fullWidth startIcon={<CalendarMonth />} onClick={() => router.push(`/appointments?lawyer=${l.id}`)}>
                    Randevu Al
                  </Button>
                  <Button variant="outlined" fullWidth startIcon={<Person />} onClick={() => router.push(`/messages?u=${l.id}`)}>
                    Mesaj
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Person sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>Avukat bulunamadı</Typography>
        </Box>
      )}
    </Box>
  );
}
