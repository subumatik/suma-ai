'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Button, Stepper, Step, StepLabel,
  TextField, FormControl, InputLabel, Select, MenuItem, Chip, Alert,
  Grid, Slider, FormControlLabel, Checkbox,
} from '@mui/material';
import { CloudUpload, NavigateNext, NavigateBefore, Science } from '@mui/icons-material';
import { createClient } from '@/lib/supabase/client';
import { invalidateDashboardCache, invalidatePatientListCache } from '@/lib/upstash/cache-actions';

const steps = ['Hasta Seçimi', 'Görüntü Yükle', 'Klinik Form', 'Ön İzleme'];

interface Patient {
  id: string;
  anonymous_hash: string;
  age: number | null;
  gender: string | null;
}

export default function NewAnalysisClient({ patients, userId }: { patients: Patient[]; userId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatient = searchParams.get('patient');
  const supabase = createClient();

  const [activeStep, setActiveStep] = useState(preselectedPatient ? 1 : 0);
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient ?? '');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    symptom_duration_days: '',
    itching_severity: 0,
    redness_score: 0,
    scaling_present: false,
    previous_treatment: '',
    immune_status: '',
    skin_type: '',
    cosmetic_usage: '',
    stress_level: 0,
    sleep_quality: 0,
  });

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        patient_id: selectedPatient,
        image_url: imageUrl || 'pending',
        status: 'PENDING',
        progress: 0,
      })
      .select()
      .single();

    if (analysisError || !analysis) {
      setLoading(false);
      setError(analysisError?.message ?? 'Analiz oluşturulamadı');
      return;
    }

    const { error: formError } = await supabase.from('clinical_forms').insert({
      analysis_id: analysis.id,
      age: formData.age ? parseInt(formData.age) : null,
      gender: formData.gender || null,
      symptom_duration_days: formData.symptom_duration_days ? parseInt(formData.symptom_duration_days) : null,
      itching_severity: formData.itching_severity || null,
      redness_score: formData.redness_score || null,
      scaling_present: formData.scaling_present,
      previous_treatment: formData.previous_treatment || null,
      immune_status: formData.immune_status || null,
      skin_type: formData.skin_type || null,
      cosmetic_usage: formData.cosmetic_usage || null,
      stress_level: formData.stress_level || null,
      sleep_quality: formData.sleep_quality || null,
    });

    setLoading(false);

    if (formError) {
      setError(formError.message);
      return;
    }

    await invalidateDashboardCache(userId);
    await invalidatePatientListCache(userId);
    router.push(`/analiz/${analysis.id}`);
  };

  const selectedPatientData = patients.find((p) => p.id === selectedPatient);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Yeni Analiz</Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
        Demodex analizi için hasta seçin, görüntü yükleyin ve klinik formu doldurun.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Hasta Seçimi</Typography>
            <FormControl fullWidth>
              <InputLabel>Hasta</InputLabel>
              <Select value={selectedPatient} label="Hasta" onChange={(e) => setSelectedPatient(e.target.value)}>
                {patients.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.anonymous_hash} {p.age ? `(${p.age} yaş)` : ''} {p.gender ? `- ${p.gender}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {patients.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Henüz hasta kaydı yok. Önce <strong>Hastalar</strong> sayfasından yeni hasta ekleyin.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {activeStep === 1 && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Görüntü Yükle</Typography>
            <TextField
              fullWidth
              label="Görüntü URL"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              helperText="Şimdilik görüntü URL'si girin. Cloudflare R2 entegrasyonu yakında."
            />
            {imageUrl && (
              <Box component="img" src={imageUrl} sx={{ mt: 2, maxHeight: 300, borderRadius: 2, width: '100%', objectFit: 'cover' }} />
            )}
          </CardContent>
        </Card>
      )}

      {activeStep === 2 && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Klinik Form (12 Değişken)</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Yaş" type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Cinsiyet</InputLabel>
                  <Select value={formData.gender} label="Cinsiyet" onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <MenuItem value=""><em>Belirtilmemiş</em></MenuItem>
                    <MenuItem value="Kadın">Kadın</MenuItem>
                    <MenuItem value="Erkek">Erkek</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Semptom Süresi (gün)" type="number" value={formData.symptom_duration_days} onChange={(e) => setFormData({ ...formData, symptom_duration_days: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Önceki Tedavi" value={formData.previous_treatment} onChange={(e) => setFormData({ ...formData, previous_treatment: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Bağışıklık Durumu" value={formData.immune_status} onChange={(e) => setFormData({ ...formData, immune_status: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Cilt Tipi" value={formData.skin_type} onChange={(e) => setFormData({ ...formData, skin_type: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Kozmetik Kullanımı" value={formData.cosmetic_usage} onChange={(e) => setFormData({ ...formData, cosmetic_usage: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Checkbox checked={formData.scaling_present} onChange={(e) => setFormData({ ...formData, scaling_present: e.target.checked })} />}
                  label="Pullanma Var"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption">Kaşınma Şiddeti: {formData.itching_severity}</Typography>
                <Slider value={formData.itching_severity} onChange={(_, v) => setFormData({ ...formData, itching_severity: v as number })} max={10} step={1} marks />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption">Kızarıklık Skoru: {formData.redness_score}</Typography>
                <Slider value={formData.redness_score} onChange={(_, v) => setFormData({ ...formData, redness_score: v as number })} max={10} step={1} marks />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption">Stres Seviyesi: {formData.stress_level}</Typography>
                <Slider value={formData.stress_level} onChange={(_, v) => setFormData({ ...formData, stress_level: v as number })} max={10} step={1} marks />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption">Uyku Kalitesi: {formData.sleep_quality}</Typography>
                <Slider value={formData.sleep_quality} onChange={(_, v) => setFormData({ ...formData, sleep_quality: v as number })} max={10} step={1} marks />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {activeStep === 3 && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Ön İzleme</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Hasta</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {selectedPatientData?.anonymous_hash ?? 'Seçilmedi'}
              </Typography>
            </Box>
            {imageUrl && (
              <Box component="img" src={imageUrl} sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 2, mb: 2 }} />
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {formData.age && <Chip label={`Yaş: ${formData.age}`} />}
              {formData.gender && <Chip label={`Cinsiyet: ${formData.gender}`} />}
              {formData.symptom_duration_days && <Chip label={`Süre: ${formData.symptom_duration_days} gün`} />}
              <Chip label={`Kaşınma: ${formData.itching_severity}/10`} />
              <Chip label={`Kızarıklık: ${formData.redness_score}/10`} />
              <Chip label={`Stres: ${formData.stress_level}/10`} />
              <Chip label={`Uyku: ${formData.sleep_quality}/10`} />
              {formData.scaling_present && <Chip label="Pullanma Var" color="warning" />}
            </Box>
            <Alert severity="info">
              Analiz başlatıldığında yapay zeka görüntüyü işleyecek ve rapor hazırlayacaktır.
            </Alert>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button disabled={activeStep === 0} onClick={handleBack} startIcon={<NavigateBefore />}>Geri</Button>
        <Button variant="contained" onClick={handleNext} disabled={loading || (activeStep === 0 && !selectedPatient)} endIcon={activeStep === steps.length - 1 ? <Science /> : <NavigateNext />}>
          {loading ? 'Oluşturuluyor...' : activeStep === steps.length - 1 ? 'Analiz Başlat' : 'İleri'}
        </Button>
      </Box>
    </Box>
  );
}
