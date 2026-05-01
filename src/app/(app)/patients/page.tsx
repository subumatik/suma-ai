"use client";

import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Avatar,
} from "@mui/material";
import { PersonAdd as PersonAddIcon } from "@mui/icons-material";

const patients = [
  { id: 1, name: "Ayse Yilmaz", age: 34, gender: "Kadin", lastVisit: "15.04.2025", status: "Aktif" },
  { id: 2, name: "Mehmet Kaya", age: 45, gender: "Erkek", lastVisit: "14.04.2025", status: "Aktif" },
  { id: 3, name: "Zeynep Demir", age: 28, gender: "Kadin", lastVisit: "13.04.2025", status: "Takipte" },
  { id: 4, name: "Ali Yildiz", age: 52, gender: "Erkek", lastVisit: "12.04.2025", status: "Aktif" },
  { id: 5, name: "Fatma Sahin", age: 41, gender: "Kadin", lastVisit: "10.04.2025", status: "Tamamlandi" },
];

export default function PatientsPage() {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Hastalar
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          sx={{ borderRadius: 3 }}
        >
          Yeni Hasta
        </Button>
      </Box>

      <Paper
        elevation={2}
        sx={{ borderRadius: 3, border: 1, borderColor: "divider", overflow: "hidden" }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell>Hasta</TableCell>
                <TableCell>Yas</TableCell>
                <TableCell>Cinsiyet</TableCell>
                <TableCell>Son Ziyaret</TableCell>
                <TableCell>Durum</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                        {patient.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {patient.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.gender}</TableCell>
                  <TableCell>{patient.lastVisit}</TableCell>
                  <TableCell>
                    <Chip
                      label={patient.status}
                      size="small"
                      color={
                        patient.status === "Aktif"
                          ? "success"
                          : patient.status === "Takipte"
                          ? "warning"
                          : "default"
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
