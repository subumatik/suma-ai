"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Collapse,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  Science as ScienceIcon,
} from "@mui/icons-material";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const mainNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "AI Asistan", href: "/chat", icon: ChatIcon },
  { label: "Hastalar", href: "/patients", icon: PeopleIcon },
];

const reportNavItems = [
  { label: "Raporlar", href: "/raporlar", icon: AssessmentIcon },
  { label: "Ayarlar", href: "/ayarlar", icon: SettingsIcon },
];

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [reportsOpen, setReportsOpen] = useState(false);

  const drawerWidth = 260;
  const collapsedWidth = 68;

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        transition: "width 0.3s ease",
        "& .MuiDrawer-paper": {
          width: open ? drawerWidth : collapsedWidth,
          transition: "width 0.3s ease, background-color 0.2s ease",
          overflowX: "hidden",
          bgcolor: "background.paper",
          color: "text.primary",
          borderRight: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "space-between" : "center",
          px: open ? 2 : 1,
          py: 2,
          minHeight: 64,
        }}
      >
        {open && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ScienceIcon sx={{ color: "primary.main", fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, letterSpacing: "-0.5px", fontSize: "1.1rem" }}
            >
              Demodex AI
            </Typography>
          </Box>
        )}
        <IconButton
          onClick={onToggle}
          sx={{
            color: "text.secondary",
            p: 0.75,
          }}
        >
          <ChevronLeftIcon
            sx={{
              transform: open ? "none" : "rotate(180deg)",
              transition: "transform 0.3s ease",
            }}
          />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: "divider" }} />

      {/* Main Nav */}
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={open ? "" : item.label} placement="right">
                <ListItemButton
                  component={Link}
                  href={item.href}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    minHeight: 44,
                    justifyContent: open ? "initial" : "center",
                    px: open ? 2 : 1.5,
                    bgcolor: isActive ? "action.selected" : "transparent",
                    color: isActive ? "primary.main" : "text.secondary",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                    "&.Mui-selected": {
                      bgcolor: "action.selected",
                      color: "primary.main",
                      "&:hover": {
                        bgcolor: "action.selected",
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 2 : 0,
                      justifyContent: "center",
                      color: isActive ? "primary.main" : "text.secondary",
                    }}
                  >
                    <Icon sx={{ fontSize: 22 }} />
                  </ListItemIcon>
                  {open && (
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: { sx: { fontWeight: isActive ? 600 : 500, fontSize: '0.9rem' } },
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}

        {open && (
          <>
            <Box sx={{ px: 2, pt: 2, pb: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "text.disabled",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  fontSize: "0.7rem",
                }}
              >
                Raporlar & Ayarlar
              </Typography>
            </Box>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => setReportsOpen(!reportsOpen)}
                sx={{
                  borderRadius: 2,
                  minHeight: 44,
                  px: 2,
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 2, color: "text.secondary" }}>
                  <AssessmentIcon sx={{ fontSize: 22 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Raporlar"
                  slotProps={{ primary: { sx: { fontWeight: 500, fontSize: '0.9rem' } } }}
                />
                {reportsOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
              </ListItemButton>
            </ListItem>

            <Collapse in={reportsOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {reportNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        component={Link}
                        href={item.href}
                        selected={isActive}
                        sx={{
                          borderRadius: 2,
                          minHeight: 40,
                          pl: 4,
                          pr: 2,
                          bgcolor: isActive ? "action.selected" : "transparent",
                          color: isActive ? "primary.main" : "text.secondary",
                          "&:hover": { bgcolor: "action.hover" },
                          "&.Mui-selected": {
                            bgcolor: "action.selected",
                            color: "primary.main",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: 2,
                            color: isActive ? "primary.main" : "text.secondary",
                          }}
                        >
                          <Icon sx={{ fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          slotProps={{
                            primary: { sx: { fontWeight: isActive ? 600 : 400, fontSize: '0.875rem' } },
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </>
        )}
      </List>

      {/* Footer */}
      {open && (
        <>
          <Divider sx={{ borderColor: "divider" }} />
          <Box sx={{ p: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: "text.disabled", display: "block" }}
            >
              Demodex AI v1.0
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.disabled" }}
            >
              &copy; 2025 Tüm haklari saklidir.
            </Typography>
          </Box>
        </>
      )}
    </Drawer>
  );
}
