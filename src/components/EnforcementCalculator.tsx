'use client';

import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Divider, Grid,
} from '@mui/material';
import { Calculate } from '@mui/icons-material';

export default function EnforcementCalculator() {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('25'); // yıllık % yasal faiz
  const [days, setDays] = useState('');
  const [attorneyPercent, setAttorneyPercent] = useState('10');
  const [officerFee, setOfficerFee] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleCalculate = () => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate) || 0;
    const d = parseFloat(days) || 0;
    const ap = parseFloat(attorneyPercent) || 0;
    const of = parseFloat(officerFee) || 0;

    if (isNaN(p) || isNaN(r) || isNaN(d)) {
      setResult({ error: 'Lütfen ana para, faiz oranı ve gün bilgilerini doğru girin.' });
      return;
    }

    // Günlük faiz = (AnaPara * Oran) / 36500
    const interest = (p * r * d) / 36500;
    const attorneyFee = (p * ap) / 100;
    const total = p + interest + attorneyFee + of;

    setResult({
      principal: p,
      interest,
      attorneyFee,
      officerFee: of,
      total,
      days: d,
      rate: r,
    });
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          İcra / Faiz Hesaplama Aracı
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Ana Para (TL)"
              type="number"
              fullWidth
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Yıllık Faiz Oranı (%)"
              type="number"
              fullWidth
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Gecikme Günü"
              type="number"
              fullWidth
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Vekalet Ücreti (%)"
              type="number"
              fullWidth
              value={attorneyPercent}
              onChange={(e) => setAttorneyPercent(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="İcra Müdürü Ücreti (TL)"
              type="number"
              fullWidth
              value={officerFee}
              onChange={(e) => setOfficerFee(e.target.value)}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" startIcon={<Calculate />} onClick={handleCalculate}>
            Hesapla
          </Button>
        </Box>

        {result && (
          <>
            <Divider sx={{ my: 3 }} />
            {result.error ? (
              <Typography color="error">{result.error}</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body1">
                  <strong>Ana Para:</strong> {formatCurrency(result.principal)}
                </Typography>
                <Typography variant="body1">
                  <strong>Gecikme Faizi ({result.rate}% / {result.days} gün):</strong> {formatCurrency(result.interest)}
                </Typography>
                <Typography variant="body1">
                  <strong>Vekalet Ücreti:</strong> {formatCurrency(result.attorneyFee)}
                </Typography>
                {result.officerFee > 0 && (
                  <Typography variant="body1">
                    <strong>İcra Müdürü Ücreti:</strong> {formatCurrency(result.officerFee)}
                  </Typography>
                )}
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  Toplam: {formatCurrency(result.total)}
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
