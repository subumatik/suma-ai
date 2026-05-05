'use client';

import { useState } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { CloudUpload, PictureAsPdf, Description } from '@mui/icons-material';

export default function DocumentUpload({ caseId, onUploadSuccess }: { caseId: string, onUploadSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.docx')) {
        setError('Sadece PDF ve DOCX formatları desteklenmektedir.');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', caseId);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Yükleme başarısız oldu');
      }

      setSuccess(true);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: 'background.default', borderStyle: 'dashed' }}>
      <input
        accept=".pdf,.docx"
        style={{ display: 'none' }}
        id="raised-button-file"
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor="raised-button-file">
        <Button variant="outlined" component="span" startIcon={<CloudUpload />} disabled={loading}>
          Belge Seç (PDF / DOCX)
        </Button>
      </label>

      {file && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          {file.name.endsWith('.pdf') ? <PictureAsPdf color="error" /> : <Description color="primary" />}
          <Typography variant="body2">{file.name}</Typography>
        </Box>
      )}

      {file && (
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleUpload} 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Yükleniyor...' : 'Belgeyi Yükle'}
          </Button>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>Belge başarıyla yüklendi.</Alert>}
    </Paper>
  );
}
