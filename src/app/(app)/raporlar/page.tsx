"use client";

import { Box, Typography, Paper, Button } from "@mui/material";
import { Download as DownloadIcon, PictureAsPdf as PdfIcon } from "@mui/icons-material";

const reports = [
  { id: 1, title: "Aylik Demodex Analiz Raporu", date: "Nisan 2025", type: "PDF" },
  { id: 2, title: "Hasta Istastistikleri", date: "Nisan 2025", type: "PDF" },
  { id: 3, title: "AI Model Performans Raporu", date: "Mart 2025", type: "PDF" },
];

export default function RaporlarPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Raporlar
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {reports.map((report) => (
          <Paper
            key={report.id}
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "error.light",
                  color: "error.main",
                }}
              >
                <PdfIcon />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {report.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {report.date}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ borderRadius: 3 }}
            >
              Indir
            </Button>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
