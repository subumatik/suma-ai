'use client';

import { useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, IconButton,
} from '@mui/material';
import { Visibility, Download } from '@mui/icons-material';

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

export default function ReportsClient({ reports }: { reports: Report[] }) {
  const router = useRouter();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Raporlar</Typography>
      </Box>

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
              {reports.map((report) => {
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
              {reports.length === 0 && (
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
