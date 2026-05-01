"use client";

import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from "@mui/material";
import {
  Science as ScienceIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";

const stats = [
  {
    title: "Toplam Analiz",
    value: "1,247",
    change: "+12%",
    icon: ScienceIcon,
    color: "primary" as const,
  },
  {
    title: "Aktif Hastalar",
    value: "86",
    change: "+5",
    icon: PeopleIcon,
    color: "secondary" as const,
  },
  {
    title: "Bu Ay Rapor",
    value: "34",
    change: "+8",
    icon: AssessmentIcon,
    color: "info" as const,
  },
  {
    title: "Basari Orani",
    value: "%94.2",
    change: "+2.1%",
    icon: TrendingUpIcon,
    color: "success" as const,
  },
];

const recentAnalyses = [
  { patient: "Ayse Yilmaz", date: "15 Nis 2025", result: "Pozitif - Orta", severity: "moderate" as const },
  { patient: "Mehmet Kaya", date: "14 Nis 2025", result: "Negatif", severity: "none" as const },
  { patient: "Zeynep Demir", date: "13 Nis 2025", result: "Pozitif - Hafif", severity: "mild" as const },
  { patient: "Ali Yildiz", date: "12 Nis 2025", result: "Pozitif - Agir", severity: "severe" as const },
];

export default function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.title}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 3,
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: `${stat.color}.main`,
                        color: `${stat.color}.contrastText`,
                      }}
                    >
                      <Icon sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "success.main",
                        fontWeight: 600,
                        bgcolor: "success.light",
                        px: 1,
                        py: 0.5,
                        borderRadius: 5,
                      }}
                    >
                      {stat.change}
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Son Analizler
            </Typography>
            {recentAnalyses.map((analysis, idx) => (
              <Box key={idx}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 2,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {analysis.patient}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {analysis.date}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600 }}
                      color={
                        analysis.severity === "none"
                          ? "success.main"
                          : analysis.severity === "severe"
                          ? "error.main"
                          : "warning.main"
                      }
                    >
                      {analysis.result}
                    </Typography>
                  </Box>
                </Box>
                {idx < recentAnalyses.length - 1 && (
                  <Box sx={{ borderBottom: 1, borderColor: "divider" }} />
                )}
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Sistem Durumu
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    AI Model
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} color="success.main">
                    Aktif
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={98}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Goruntu Isleme
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} color="success.main">
                    Aktif
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={95}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Veritabani
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} color="success.main">
                    Bagli
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
