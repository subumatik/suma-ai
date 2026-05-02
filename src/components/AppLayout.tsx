'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Typography, Avatar,
  Badge, Menu, MenuItem, Divider, useMediaQuery,
} from '@mui/material';
import {
  Dashboard, People, AddCircle, Assignment, Settings,
  Logout, Menu as MenuIcon, ChevronLeft, Notifications, Science,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { createClient } from '@/lib/supabase/client';
import ThemeToggle from './ThemeToggle';
import { useAuth } from './AuthProvider';

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 72;

const navItems = [
  { label: 'Dashboard', path: '/', icon: <Dashboard /> },
  { label: 'Hasta Listesi', path: '/patients', icon: <People /> },
  { label: 'Yeni Analiz', path: '/analiz/yeni', icon: <AddCircle /> },
  { label: 'AI Sohbet', path: '/chat', icon: <ChatIcon /> },
  { label: 'Raporlar', path: '/raporlar', icon: <Assignment /> },
  { label: 'Ayarlar', path: '/ayarlar', icon: <Settings /> },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { user: authUser } = useAuth();
  const isMobile = useMediaQuery('(max-width: 960px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const drawerWidth = isMobile ? DRAWER_WIDTH : (collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH);

  const notifications = [
    { id: 1, text: 'Yeni analiz tamamlandı: Hasta #A7B2C1', time: '5 dk önce', read: false },
    { id: 2, text: 'Dr. Matik bir raporu onayladı', time: '1 saat önce', read: false },
    { id: 3, text: 'Sistem bakımı: 03:00', time: '3 saat önce', read: true },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2.5, minHeight: 72, gap: 1.5 }}>
        <Science sx={{ color: 'primary.main', fontSize: 28 }} />
        {!collapsed && (
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            Demodex AI
          </Typography>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {navItems.map((item) => {
          const active = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={active}
                onClick={() => { router.push(item.path); if (isMobile) setMobileOpen(false); }}
                sx={{ borderRadius: 2.5, minHeight: 48, justifyContent: collapsed ? 'center' : 'initial', px: collapsed ? 2 : 2.5 }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: 'center', color: active ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: active ? 600 : 400, color: active ? 'primary.main' : 'text.secondary' } } }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      {!isMobile && (
        <Box sx={{ p: 1.5 }}>
          <IconButton onClick={() => setCollapsed(!collapsed)} sx={{ color: 'text.secondary' }}>
            <ChevronLeft sx={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Drawer */}
      {isMobile ? (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          slotProps={{ paper: { sx: { width: DRAWER_WIDTH, boxSizing: 'border-box', bgcolor: 'background.paper' } } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer variant="permanent"
          sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', transition: 'width 0.3s' } }}>
          {drawer}
        </Drawer>
      )}

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, ml: 0 }}>
        <AppBar position="sticky" elevation={0}
          sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` }, transition: 'width 0.3s, margin-left 0.3s' }}>
          <Toolbar sx={{ minHeight: 64, px: { xs: 2, md: 3 } }}>
            {isMobile && (
              <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 2, color: 'text.primary' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', flexGrow: 1 }}>
              {navItems.find((n) => pathname === n.path || pathname.startsWith(n.path + '/'))?.label || 'Demodex AI'}
            </Typography>
            <ThemeToggle />
            <IconButton onClick={(e) => setNotifAnchorEl(e.currentTarget)} sx={{ color: 'text.secondary' }}>
              <Badge badgeContent={notifications.filter((n) => !n.read).length} color="error"><Notifications /></Badge>
            </IconButton>
            <Menu
              anchorEl={notifAnchorEl}
              open={Boolean(notifAnchorEl)}
              onClose={() => setNotifAnchorEl(null)}
              slotProps={{
                paper: { sx: { borderRadius: 3, minWidth: 320, maxWidth: 360 } },
              }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Bildirimler
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {notifications.filter((n) => !n.read).length} okunmamış
                </Typography>
              </Box>
              <Divider />
              {notifications.map((n) => (
                <MenuItem
                  key={n.id}
                  onClick={() => setNotifAnchorEl(null)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    bgcolor: n.read ? 'inherit' : 'action.hover',
                    borderLeft: 3,
                    borderColor: n.read ? 'transparent' : 'primary.main',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>
                      {n.text}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {n.time}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
              {notifications.length === 0 && (
                <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Bildirim bulunmuyor.
                  </Typography>
                </Box>
              )}
            </Menu>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.dark', fontSize: 14, fontWeight: 600 }}>
                {(authUser?.email?.charAt(0) ?? 'U').toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
              slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 180 } } }}>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {authUser?.user_metadata?.full_name ?? authUser?.email ?? 'Kullanıcı'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {authUser?.email ?? ''}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); router.push('/ayarlar'); }}>
                <Settings sx={{ mr: 1.5, fontSize: 18, color: 'text.secondary' }} /> Ayarlar
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); handleLogout(); }}>
                <Logout sx={{ mr: 1.5, fontSize: 18, color: 'error.main' }} /> Çıkış
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ p: { xs: 2, md: 3 }, minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
