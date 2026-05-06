'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Typography, Avatar,
  Badge, Menu, MenuItem, Divider, useMediaQuery, alpha,
} from '@mui/material';
import {
  Dashboard, Folder, CalendarMonth, Chat, People, Person,
  Logout, Menu as MenuIcon, ChevronLeft, Notifications, Balance,
  Settings, AdminPanelSettings, Category, Rule,
} from '@mui/icons-material';
import { createClient } from '@/lib/supabase/client';
import ThemeToggle from './ThemeToggle';
import { useAuth } from './AuthProvider';

const DRAWER_WIDTH = 270;
const DRAWER_COLLAPSED = 76;

const lawyerNavItems = [
  { label: 'Anasayfa', path: '/dashboard', icon: <Dashboard /> },
  { label: 'Müvekkillerim', path: '/clients', icon: <People /> },
  { label: 'Dosyalarım', path: '/cases', icon: <Folder /> },
  { label: 'Randevularım', path: '/appointments', icon: <CalendarMonth /> },
  { label: 'Mesajlar', path: '/messages', icon: <Chat /> },
  { label: 'Kategoriler', path: '/categories', icon: <Category /> },
  { label: 'Durumlar', path: '/statuses', icon: <Rule /> },
  { label: 'Ayarlar', path: '/settings', icon: <Settings /> },
];

const clientNavItems = [
  { label: 'Anasayfa', path: '/dashboard', icon: <Dashboard /> },
  { label: 'Dosyalarım', path: '/cases', icon: <Folder /> },
  { label: 'Randevularım', path: '/appointments', icon: <CalendarMonth /> },
  { label: 'Mesajlar', path: '/messages', icon: <Chat /> },
  { label: 'Avukatlarım', path: '/lawyers', icon: <Person /> },
  { label: 'Ayarlar', path: '/settings', icon: <Settings /> },
];

const adminNavItem = { label: 'Yönetim', path: '/admin', icon: <AdminPanelSettings /> };

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

/** Format a date string as a relative time label (e.g. "5 dk önce") */
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { user: authUser, role } = useAuth();
  const isMobile = useMediaQuery('(max-width: 960px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const drawerWidth = isMobile ? DRAWER_WIDTH : (collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH);

  const baseNavItems = role === 'lawyer' ? lawyerNavItems : clientNavItems;
  const navItems = role === 'admin'
    ? [baseNavItems[0], adminNavItem, ...baseNavItems.slice(1)]
    : baseNavItems;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data: NotificationItem[] = await res.json();
        setNotifications(data);
      }
    } catch {
      // silently ignore – notifications are non-critical
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotifClick = async (id: string) => {
    // Optimistically mark as read in UI
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setNotifAnchorEl(null);

    // Persist read state to DB
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2.5, minHeight: 72, gap: 1.5 }}>
        <Balance sx={{ color: 'primary.main', fontSize: 28 }} />
        {!collapsed && (
          <Typography variant="h6" sx={{ letterSpacing: '-0.02em', fontFamily: '"Montserrat",sans-serif' }}>
            <Box component="span" sx={{ fontWeight: 700 }}>Avu</Box>
            <Box component="span" sx={{ fontWeight: 400 }}>katip</Box>
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
                sx={{
                  borderRadius: 2.5,
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: collapsed ? 2 : 2.5,
                  ...(active && {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15) },
                  }),
                }}
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
        <AppBar position="fixed" elevation={0}
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` }, transition: 'width 0.3s, margin-left 0.3s' }}>
          <Toolbar sx={{ minHeight: 64, px: { xs: 2, md: 3 } }}>
            {isMobile && (
              <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 2, color: 'text.primary' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', flexGrow: 1 }}>
              {navItems.find((n) => pathname === n.path || pathname.startsWith(n.path + '/'))?.label || 'Avukatip'}
            </Typography>
            <ThemeToggle />
            <IconButton onClick={(e) => setNotifAnchorEl(e.currentTarget)} sx={{ color: 'text.secondary' }}>
              <Badge badgeContent={notifications.filter((n) => !n.is_read).length} color="error"><Notifications /></Badge>
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
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Bildirimler</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {notifications.filter((n) => !n.is_read).length} okunmamış
                </Typography>
              </Box>
              <Divider />
              {notifications.map((n) => (
                <MenuItem
                  key={n.id}
                  onClick={() => handleNotifClick(n.id)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    bgcolor: n.is_read ? 'inherit' : 'action.hover',
                    borderLeft: 3,
                    borderColor: n.is_read ? 'transparent' : 'primary.main',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: n.is_read ? 400 : 600, lineHeight: 1.4 }}>
                      {n.title}
                    </Typography>
                    {n.message && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {n.message}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {formatRelativeTime(n.created_at)}
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
              <MenuItem onClick={() => { setAnchorEl(null); router.push('/settings'); }}>
                <Settings sx={{ mr: 1.5, fontSize: 18, color: 'text.secondary' }} /> Ayarlar
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); handleLogout(); }}>
                <Logout sx={{ mr: 1.5, fontSize: 18, color: 'error.main' }} /> Çıkış
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ p: { xs: 2, md: 4 }, pt: { xs: '80px', md: '96px' }, minHeight: '100vh' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
