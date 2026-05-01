"use client";

import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Switch,
  Divider,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { useState } from "react";

export default function AyarlarPage() {
  const [notifications, setNotifications] = useState(true);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [language, setLanguage] = useState("tr");

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Ayarlar
      </Typography>

      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <List>
          <ListItem>
            <ListItemText
              primary="Bildirimler"
              secondary="Yeni analiz ve rapor bildirimlerini al"
              slotProps={{ primary: { sx: { fontWeight: 600 } } }}
            />
            <Switch
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemText
              primary="Otomatik Analiz"
              secondary="Goruntu yuklendiginde otomatik analiz baslat"
              slotProps={{ primary: { sx: { fontWeight: 600 } } }}
            />
            <Switch
              checked={autoAnalyze}
              onChange={(e) => setAutoAnalyze(e.target.checked)}
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemText
              primary="Dil"
              secondary="Arayuz dilini secin"
              slotProps={{ primary: { sx: { fontWeight: 600 } } }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <MenuItem value="tr">Turkce</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}
