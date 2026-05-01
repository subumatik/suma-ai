'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Button, Stepper, Step, StepLabel,
  TextField, FormControl, InputLabel, Select, MenuItem, Chip,
  Alert,
} from '@mui/material';
import {
  CloudUpload, NavigateNext, NavigateBefore, Science,
} from '@mui/icons-material';

const steps = ['Görüntü Yükle', 'Klinik Form', 'Ön İzleme'];

export default function NewAnalysisPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    symptoms: '',
    duration: '',
    previousTreatment: '',
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      const analysisId = Math.random().toString(36).slice(2);
      router.push(`/analiz/${analysisId}`);
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Yeni Analiz</Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
        Demodex analizi için görüntü ve klinik verileri yükleyin.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 3,
                p: 6,
                textAlign: 'center',
                bgcolor: 'action.hover',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(93,202,165,0.04)' },
              }}
              component="label"
            >
              <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
              {imagePreview ? (
                <Box component="img" src={imagePreview} sx={{ maxHeight: 300, borderRadius: 2 }} />
              ) : (
                <>
                  <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>Görüntü Yükleyin</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Mikroskobik, dermoskopik veya klinik fotoğraf
                  </Typography>
                </>
              )}
            </Box>
            {imageFile && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {imageFile.name} yüklendi
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {activeStep === 1 && (
        <Card>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Klinik Form</Typography>
            <TextField label="Yaş" type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
            <FormControl>
              <InputLabel>Cinsiyet</InputLabel>
              <Select value={formData.gender} label="Cinsiyet" onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                <MenuItem value="Kadin">Kadın</MenuItem>
                <MenuItem value="Erkek">Erkek</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Semptomlar" multiline rows={2} value={formData.symptoms} onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })} />
            <TextField label="Süre (ay)" type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
            <TextField label="Önceki Tedavi" multiline rows={2} value={formData.previousTreatment} onChange={(e) => setFormData({ ...formData, previousTreatment: e.target.value })} />
          </CardContent>
        </Card>
      )}

      {activeStep === 2 && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Ön İzleme</Typography>
            {imagePreview && (
              <Box component="img" src={imagePreview} sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 2, mb: 2 }} />
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(formData).map(([key, value]) =>
                value ? <Chip key={key} label={`${key}: ${value}`} /> : null
              )}
            </Box>
            <Alert severity="info" sx={{ mt: 2 }}>
              Analiz başlatıldığında yapay zeka görüntüyü işleyecek ve rapor hazırlayacaktır.
            </Alert>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button disabled={activeStep === 0} onClick={handleBack} startIcon={<NavigateBefore />}>
          Geri
        </Button>
        <Button variant="contained" onClick={handleNext} endIcon={activeStep === steps.length - 1 ? <Science /> : <NavigateNext />}>
          {activeStep === steps.length - 1 ? 'Analiz Başlat' : 'İleri'}
        </Button>
      </Box>
    </Box>
  );
}
