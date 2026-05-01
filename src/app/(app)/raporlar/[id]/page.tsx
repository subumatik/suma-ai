'use client';

import { useParams } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Chip, Grid, Button, Divider, Alert,
} from '@mui/material';
import { Download, Share, Warning } from '@mui/icons-material';

const mockReport = {
  id: 'a1',
  patientHash: 'a7f3c8e2d4b1',
  date: '15.04.2025',
  type: 'Mikroskobik',
  status: 'Tamamlandı',
  confidence: 0.91,
  miteCount: 12,
  density: 'Orta-Yüksek',
  diagnosis: 'Demodex folliculorum - Orta yoğunluk',
  recommendation: 'Topikal metronidazol + oral ivermektin tedavisi önerilir. 4 hafta sonra kontrol.',
  shapFactors: [
    { factor: 'Yaş', contribution: 0.23 },
    { factor: 'Cilt tipi', contribution: 0.18 },
    { factor: 'Semptom süresi', contribution: 0.15 },
    { factor: 'Önceki tedavi', contribution: 0.12 },
  ],
};

export default function ReportPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Klinik Rapor</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Rapor ID: {id} · {mockReport.date}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Share />}>Paylaş</Button>
          <Button variant="contained" startIcon={<Download />}>PDF İndir</Button>
        </Box>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }} icon={<Warning />}>
        Bu rapor klinik değerlendirmenin yerini tutmaz. Tanı ve tedavi kararı nihai olarak hekim tarafından verilmelidir.
      </Alert>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Tespit Sonuçları</Typography>
                <Chip label={`Güven: %${Math.round(mockReport.confidence * 100)}`} color="success" />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>Akarsayisi</Typography><Typography variant="h5" sx={{ fontWeight: 700 }}>{mockReport.miteCount}</Typography></Box>
                <Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>Yoğunluk</Typography><Typography variant="h5" sx={{ fontWeight: 700 }}>{mockReport.density}</Typography></Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Olası Tanı</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>{mockReport.diagnosis}</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Tedavi Önerisi</Typography>
              <Typography variant="body2">{mockReport.recommendation}</Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>SHAP Analizi — Risk Faktörleri</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mockReport.shapFactors.map((f) => (
                  <Box key={f.factor}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{f.factor}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>%{Math.round(f.contribution * 100)}</Typography>
                    </Box>
                    <Box sx={{ width: '100%', bgcolor: 'action.disabledBackground', borderRadius: 2, height: 8 }}>
                      <Box sx={{ width: `${f.contribution * 100}%`, bgcolor: 'primary.main', borderRadius: 2, height: 8 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Rapor Özeti</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>Hasta Hash</Typography><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{mockReport.patientHash}</Typography></Box>
                <Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>Analiz Tipi</Typography><Typography variant="body2">{mockReport.type}</Typography></Box>
                <Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>Tarih</Typography><Typography variant="body2">{mockReport.date}</Typography></Box>
                <Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>Durum</Typography><Chip label={mockReport.status} size="small" color="success" /></Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
