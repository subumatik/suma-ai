'use client';

import { useParams } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Avatar, Chip, Grid, Button, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import { Edit } from '@mui/icons-material';

const mockPatient = {
  id: '1',
  name: 'Ayşe Yılmaz',
  age: 34,
  gender: 'Kadın',
  phone: '0532 123 45 67',
  email: 'ayse@example.com',
  lastVisit: '15.04.2025',
  status: 'Aktif',
  notes: 'Hasta orta şiddetli Demodex belirtileri gösteriyor. İkinci analiz için planlandı.',
  analyses: [
    { id: 'a1', date: '15.04.2025', type: 'Mikroskobik', result: 'Pozitif - Orta', confidence: 0.91 },
    { id: 'a2', date: '01.03.2025', type: 'Dermoskopik', result: 'Pozitif - Hafif', confidence: 0.84 },
  ],
};

export default function PatientDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}>
            {mockPatient.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{mockPatient.name}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {mockPatient.age} yaş · {mockPatient.gender} · Hasta ID: {id}
            </Typography>
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<Edit />}>Düzenle</Button>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Hasta Bilgileri</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>Telefon</Typography><Typography variant="body2">{mockPatient.phone}</Typography></Box>
                <Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>E-posta</Typography><Typography variant="body2">{mockPatient.email}</Typography></Box>
                <Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>Son Ziyaret</Typography><Typography variant="body2">{mockPatient.lastVisit}</Typography></Box>
                <Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>Durum</Typography><Chip label={mockPatient.status} size="small" color="success" /></Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Klinik Notlar</Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>{mockPatient.notes}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Analiz Geçmişi</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Tip</TableCell>
                      <TableCell>Sonuç</TableCell>
                      <TableCell>Güven</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockPatient.analyses.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell>{a.date}</TableCell>
                        <TableCell>{a.type}</TableCell>
                        <TableCell>{a.result}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: a.confidence >= 0.85 ? 'success.main' : 'warning.main' }}>
                          %{Math.round(a.confidence * 100)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
