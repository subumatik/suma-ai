'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, LinearProgress, Chip, Button,
  Grid, Divider, Alert, Paper, Link,
} from '@mui/material';
import { CheckCircle, Error, Science, Assignment, ArrowBack } from '@mui/icons-material';

interface AnalysisData {
  id: string;
  status: string;
  progress: number;
  image_url: string;
  created_at: string;
  patients: { anonymous_hash: string; age: number | null; gender: string | null } | null;
  clinical_forms: {
    age: number | null;
    gender: string | null;
    symptom_duration_days: number | null;
    itching_severity: number | null;
    redness_score: number | null;
    scaling_present: boolean;
    previous_treatment: string | null;
    immune_status: string | null;
    skin_type: string | null;
    cosmetic_usage: string | null;
    stress_level: number | null;
    sleep_quality: number | null;
  } | null;
  analysis_results: {
    mite_count: number | null;
    mite_density: string | null;
    confidence_score: number | null;
    gemma_report_tr: string | null;
    gemma_report_en: string | null;
    composite_score: number | null;
    gradcam_url: string | null;
    created_at: string;
  }[] | null;
}

export default function AnalysisDetailClient({ analysis }: { analysis: AnalysisData }) {
  const router = useRouter();
  const result = analysis.analysis_results?.[0];
  const [similarCases, setSimilarCases] = useState<Array<{
    analysis_id: string;
    patient_hash: string;
    label: string;
    mite_count?: number;
    confidence_score?: number;
    score: number;
  }> | null>(null);

  useEffect(() => {
    if (analysis.status === 'COMPLETED' && analysis.clinical_forms) {
      fetch('/api/vector/similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: analysis.id,
          form: analysis.clinical_forms,
          topK: 5,
        }),
      })
        .then((res) => res.json())
        .then((data) => setSimilarCases(data.similar ?? []))
        .catch((err) => console.error('Similar cases fetch error:', err));
    }
  }, [analysis.status, analysis.id, analysis.clinical_forms]);

  const statusConfig = {
    PENDING: { label: 'Bekleniyor', color: 'warning' as const, icon: <Science /> },
    PROCESSING: { label: 'İşleniyor', color: 'info' as const, icon: <Science /> },
    COMPLETED: { label: 'Tamamlandı', color: 'success' as const, icon: <CheckCircle /> },
    FAILED: { label: 'Hata', color: 'error' as const, icon: <Error /> },
  };

  const status = statusConfig[analysis.status as keyof typeof statusConfig] ?? statusConfig.PENDING;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Button startIcon={<ArrowBack />} onClick={() => router.push('/patients')} sx={{ mb: 2 }}>
        Geri
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Analiz Detayı</Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
        ID: <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{analysis.id.slice(0, 8)}</Box> · Hasta: {analysis.patients?.anonymous_hash}
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Durum</Typography>
            <Chip label={status.label} color={status.color} icon={status.icon} />
          </Box>
          <LinearProgress variant="determinate" value={analysis.progress} sx={{ height: 10, borderRadius: 5, mb: 3 }} />

          {(analysis.status === 'PENDING' || analysis.status === 'PROCESSING') && (
            <Alert severity="info">Yapay zeka görüntüyü analiz ediyor. Bu işlem yaklaşık 45 saniye sürebilir.</Alert>
          )}
          {analysis.status === 'FAILED' && (
            <Alert severity="error">Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.</Alert>
          )}
        </CardContent>
      </Card>

      {/* Source Image */}
      {analysis.image_url && analysis.image_url !== 'pending' && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Kaynak Görsel</Typography>
            <Box
              component="img"
              src={analysis.image_url}
              alt="Analiz görseli"
              sx={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 2, bgcolor: 'background.default' }}
            />
          </CardContent>
        </Card>
      )}
      {analysis.image_url === 'pending' && (
        <Alert severity="info" sx={{ mb: 3 }}>Görsel henüz yüklenmemiş.</Alert>
      )}

      {/* Grad-CAM */}
      {result?.gradcam_url && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Grad-CAM Isı Haritası</Typography>
            <Box
              component="img"
              src={result.gradcam_url}
              alt="Grad-CAM"
              sx={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 2, bgcolor: 'background.default' }}
            />
          </CardContent>
        </Card>
      )}

      {analysis.status === 'COMPLETED' && result && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>YOLO Tespit Sonuçları</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Akar Sayısı</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{result.mite_count ?? '-'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Yoğunluk</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{result.mite_density ?? '-'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>YOLO Güven</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: (result.confidence_score ?? 0) >= 0.85 ? 'success.main' : 'warning.main' }}>
                        {result.confidence_score ? `%${Math.round(result.confidence_score * 100)}` : '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Bileşik Skor</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {result.composite_score ? result.composite_score.toFixed(2) : '-'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Klinik Form Verileri</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {analysis.clinical_forms?.age && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Yaş</Typography>
                        <Typography variant="body1">{analysis.clinical_forms.age}</Typography>
                      </Box>
                    )}
                    {analysis.clinical_forms?.gender && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Cinsiyet</Typography>
                        <Typography variant="body1">{analysis.clinical_forms.gender}</Typography>
                      </Box>
                    )}
                    {analysis.clinical_forms?.symptom_duration_days && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Semptom Süresi</Typography>
                        <Typography variant="body1">{analysis.clinical_forms.symptom_duration_days} gün</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Kaşınma</Typography>
                      <Typography variant="body1">{analysis.clinical_forms?.itching_severity ?? '-'}/10</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Kızarıklık</Typography>
                      <Typography variant="body1">{analysis.clinical_forms?.redness_score ?? '-'}/10</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {result.gemma_report_tr && (
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Gemma 4 Raporu (TR)</Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {result.gemma_report_tr}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" startIcon={<Assignment />} onClick={() => router.push(`/raporlar/${analysis.id}`)}>
              Raporu Görüntüle
            </Button>
            <Button variant="outlined" onClick={() => router.push(`/feedback?analysis=${analysis.id}`)}>
              Geri Bildirim
            </Button>
          </Box>

          {similarCases !== null && (
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Benzer Vakalar (Upstash Vector)
                </Typography>
                {similarCases.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {similarCases.map((c) => (
                      <Box
                        key={c.analysis_id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Hasta {c.patient_hash}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {c.label} · Akar: {c.mite_count ?? '-'} · Güven: {c.confidence_score ? `%${Math.round(c.confidence_score * 100)}` : '-'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={`%${Math.round(c.score * 100)} eşleşme`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Link
                            href={`/analiz/${c.analysis_id}`}
                            sx={{ ml: 1, fontSize: 12, cursor: 'pointer' }}
                            onClick={(e) => {
                              e.preventDefault();
                              router.push(`/analiz/${c.analysis_id}`);
                            }}
                          >
                            Görüntüle
                          </Link>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Henüz benzer vaka bulunmuyor. Yeni analizler eklendikçe burada görünecek.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}
