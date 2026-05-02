'use client';

import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Avatar, Chip, Grid, Button, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import { Edit, ArrowBack, Science, Image as ImageIcon } from '@mui/icons-material';

interface AnalysisResult {
  mite_count: number | null;
  mite_density: string | null;
  confidence_score: number | null;
  created_at: string;
}

interface Analysis {
  id: string;
  status: string;
  progress: number;
  image_url: string;
  created_at: string;
  analysis_results: AnalysisResult[];
}

interface Patient {
  id: string;
  anonymous_hash: string;
  age: number | null;
  gender: string | null;
  notes: string | null;
  created_at: string;
}

export default function PatientDetailClient({ patient, analyses }: { patient: Patient; analyses: Analysis[] }) {
  const router = useRouter();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}>
            {patient.anonymous_hash.slice(0, 2).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Hasta {patient.anonymous_hash}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {patient.age ? `${patient.age} yaş` : 'Yaş belirtilmemiş'} · {patient.gender ?? 'Cinsiyet belirtilmemiş'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => router.push('/patients')}>
            Geri
          </Button>
          <Button variant="contained" startIcon={<Science />} onClick={() => router.push(`/analiz/yeni?patient=${patient.id}`)}>
            Yeni Analiz
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Hasta Bilgileri</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Anonim ID</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{patient.anonymous_hash}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Yaş</Typography>
                  <Typography variant="body2">{patient.age ?? '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Cinsiyet</Typography>
                  <Typography variant="body2">{patient.gender ?? '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Durum</Typography>
                  <Chip label="Aktif" size="small" color="success" />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Kayıt Tarihi</Typography>
                  <Typography variant="body2">{new Date(patient.created_at).toLocaleDateString('tr-TR')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Klinik Notlar</Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>{patient.notes ?? 'Not bulunmuyor.'}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Analiz Geçmişi ({analyses.length})</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell>Görsel</TableCell>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell>Akar Sayısı</TableCell>
                      <TableCell>Yoğunluk</TableCell>
                      <TableCell>Güven</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyses.map((a) => {
                      const result = a.analysis_results?.[0];
                      return (
                        <TableRow key={a.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/analiz/${a.id}`)}>
                          <TableCell>
                            {a.image_url && a.image_url !== 'pending' ? (
                              <Box
                                component="img"
                                src={a.image_url}
                                sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
                              />
                            ) : (
                              <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ImageIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>{new Date(a.created_at).toLocaleDateString('tr-TR')}</TableCell>
                          <TableCell>
                            <Chip
                              label={a.status}
                              size="small"
                              color={a.status === 'COMPLETED' ? 'success' : a.status === 'FAILED' ? 'error' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>{result?.mite_count ?? '-'}</TableCell>
                          <TableCell>{result?.mite_density ?? '-'}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: (result?.confidence_score ?? 0) >= 0.85 ? 'success.main' : 'warning.main' }}>
                            {result?.confidence_score ? `%${Math.round(result.confidence_score * 100)}` : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {analyses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Henüz analiz bulunmuyor.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
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
