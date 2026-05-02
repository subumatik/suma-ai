'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Alert, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { Send, ThumbUp, ThumbDown, Edit } from '@mui/icons-material';

export default function FeedbackPage() {
  const router = useRouter();
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'correction'>('correct');
  const [comment, setComment] = useState('');
  const [severity, setSeverity] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => router.push('/'), 2000);
  };

  if (submitted) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8 }}>
        <Alert severity="success" sx={{ mb: 2 }}>Geri bildiriminiz kaydedildi. Aktif öğrenme havuzuna eklendi.</Alert>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>Ana sayfaya yönlendiriliyorsunuz...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Doktor Geri Bildirimi</Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
        Rapor doğruluğunu değerlendirin. Düzeltmeleriniz modelin iyileştirilmesinde kullanılacaktır.
      </Typography>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Rapor doğru muydu?</Typography>
          <ToggleButtonGroup
            value={feedbackType}
            exclusive
            onChange={(_, value) => value && setFeedbackType(value)}
            sx={{ mb: 3 }}
          >
            <ToggleButton value="correct"><ThumbUp sx={{ mr: 1 }} /> Doğru</ToggleButton>
            <ToggleButton value="incorrect"><ThumbDown sx={{ mr: 1 }} /> Yanlış</ToggleButton>
            <ToggleButton value="correction"><Edit sx={{ mr: 1 }} /> Düzeltme</ToggleButton>
          </ToggleButtonGroup>

          {feedbackType === 'correction' && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Doğru Şiddet</InputLabel>
              <Select value={severity} label="Doğru Şiddet" onChange={(e) => setSeverity(e.target.value)}>
                <MenuItem value="negatif">Negatif</MenuItem>
                <MenuItem value="hafif">Hafif</MenuItem>
                <MenuItem value="orta">Orta</MenuItem>
                <MenuItem value="agir">Ağır</MenuItem>
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            label="Yorum / Düzeltme"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<Send />} onClick={handleSubmit}>
              Gönder
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
