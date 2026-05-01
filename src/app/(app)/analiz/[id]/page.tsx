'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, LinearProgress, Stepper, Step, StepLabel,
  Chip, Button, Alert,
} from '@mui/material';
import {
  CheckCircle, Error, Science, Assignment,
} from '@mui/icons-material';

const analysisSteps = ['Görüntü Alındı', 'Ön İşleme', 'YOLO Tespiti', 'Gemma Rapor', 'Hazır'];

export default function AnalysisProgressPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeStep, setActiveStep] = useState(1);
  const [progress, setProgress] = useState(15);
  const [status, setStatus] = useState<'processing' | 'completed' | 'error'>('processing');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('completed');
          setActiveStep(5);
          return 100;
        }
        const next = prev + Math.random() * 15;
        if (next > 30) setActiveStep(2);
        if (next > 55) setActiveStep(3);
        if (next > 80) setActiveStep(4);
        return Math.min(next, 100);
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Analiz İlerlemesi</Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
        Analiz ID: <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{id}</Typography>
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Durum</Typography>
            {status === 'processing' && <Chip label="İşleniyor" color="info" icon={<Science />} />}
            {status === 'completed' && <Chip label="Tamamlandı" color="success" icon={<CheckCircle />} />}
            {status === 'error' && <Chip label="Hata" color="error" icon={<Error />} />}
          </Box>

          <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5, mb: 3 }} />

          <Stepper activeStep={activeStep} alternativeLabel>
            {analysisSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {status === 'processing' && (
            <Alert severity="info" sx={{ mt: 3 }}>
              Yapay zeka görüntüyü analiz ediyor. Bu işlem yaklaşık 45 saniye sürebilir.
            </Alert>
          )}

          {status === 'completed' && (
            <Alert severity="success" sx={{ mt: 3 }}>
              Analiz tamamlandı. Raporu görüntüleyebilirsiniz.
            </Alert>
          )}
        </CardContent>
      </Card>

      {status === 'completed' && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" startIcon={<Assignment />} onClick={() => router.push(`/raporlar/${id}`)}>
            Raporu Görüntüle
          </Button>
          <Button variant="outlined" onClick={() => router.push('/feedback')}>
            Geri Bildirim
          </Button>
        </Box>
      )}
    </Box>
  );
}
