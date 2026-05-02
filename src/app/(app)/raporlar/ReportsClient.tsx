'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, IconButton, TextField, InputAdornment, CircularProgress,
} from '@mui/material';
import { Visibility, Download, Search, Clear } from '@mui/icons-material';

interface Report {
  id: string;
  status: string;
  approved_at: string | null;
  created_at: string;
  pdf_url: string | null;
  analyses: {
    patient_id: string;
    patients: { anonymous_hash: string } | null;
  } | null;
  analysis_results: {
    mite_count: number | null;
    mite_density: string | null;
    confidence_score: number | null;
  }[] | null;
}

interface SearchResult {
  id: string;
  content: {
    report_tr: string;
    report_en: string;
    patient_hash: string;
    diagnosis: string;
  };
  metadata: {
    analysis_id: string;
    patient_id: string;
    doctor_id: string;
    mite_count?: number;
    confidence_score?: number;
    created_at: string;
  };
  score: number;
}

export default function ReportsClient({ reports }: { reports: Report[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 10 }),
      });
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    }
    setSearching(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Raporlar</Typography>
        <TextField
          size="small"
          placeholder="Raporlarda ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ width: { xs: '100%', sm: 320 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {searching ? <CircularProgress size={16} /> : <Search fontSize="small" />}
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={clearSearch}><Clear fontSize="small" /></IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
      </Box>

      {searchResults !== null && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {searchResults.length} sonuç bulundu
            {searchQuery && ` "${searchQuery}" için`}
          </Typography>
        </Box>
      )}

      <Paper elevation={2} sx={{ borderRadius: 3, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Hasta</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Akar Sayısı</TableCell>
                <TableCell>Yoğunluk</TableCell>
                <TableCell>Güven</TableCell>
                <TableCell>Tarih</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {searchResults !== null
                ? searchResults.map((result) => (
                    <TableRow key={result.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {result.content.patient_hash}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={result.content.diagnosis} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{result.metadata.mite_count ?? '-'}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: (result.metadata.confidence_score ?? 0) >= 0.85 ? 'success.main' : 'warning.main' }}>
                        {result.metadata.confidence_score ? `%${Math.round(result.metadata.confidence_score * 100)}` : '-'}
                      </TableCell>
                      <TableCell>{new Date(result.metadata.created_at).toLocaleDateString('tr-TR')}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => router.push(`/raporlar/${result.id}`)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                : reports.map((report) => {
                    const result = report.analysis_results?.[0];
                    return (
                      <TableRow key={report.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                            {report.analyses?.patients?.anonymous_hash ?? 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.status}
                            size="small"
                            color={report.status === 'approved' ? 'success' : report.status === 'draft' ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{result?.mite_count ?? '-'}</TableCell>
                        <TableCell>{result?.mite_density ?? '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: (result?.confidence_score ?? 0) >= 0.85 ? 'success.main' : 'warning.main' }}>
                          {result?.confidence_score ? `%${Math.round(result.confidence_score * 100)}` : '-'}
                        </TableCell>
                        <TableCell>{new Date(report.created_at).toLocaleDateString('tr-TR')}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => router.push(`/raporlar/${report.id}`)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                          {report.pdf_url && (
                            <IconButton size="small" component="a" href={report.pdf_url} target="_blank">
                              <Download fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              {searchResults !== null && searchResults.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Arama sonucu bulunamadı.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {searchResults === null && reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Henüz rapor bulunmuyor.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
