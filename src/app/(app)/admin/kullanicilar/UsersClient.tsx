'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, Typography, TextField, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Menu, MenuItem, Divider, Stack, CardContent,
  useMediaQuery, useTheme,
} from '@mui/material';
import { Search, MoreVert, Balance, Person, AdminPanelSettings, Delete } from '@mui/icons-material';

interface UsersClientProps {
  users: any[];
}

export default function UsersClient({ users }: UsersClientProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  const closeMenu = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleRoleChange = async (role: string) => {
    if (!selectedUser || loadingAction) return;
    setLoadingAction(true);

    try {
      const res = await fetch('/api/admin/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, role }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Rol güncellenemedi');

      closeMenu();
      router.refresh();
    } catch (error: any) {
      window.alert(error.message || 'Rol güncellenemedi');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || loadingAction) return;

    const confirmed = window.confirm(
      `${selectedUser.full_name ?? selectedUser.email ?? 'Bu kullanıcı'} silinsin mi? Bu işlem kullanıcı hesabını ve ilişkili kayıtları kaldırır.`
    );
    if (!confirmed) return;

    setLoadingAction(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Kullanıcı silinemedi');

      closeMenu();
      router.refresh();
    } catch (error: any) {
      window.alert(error.message || 'Kullanıcı silinemedi');
    } finally {
      setLoadingAction(false);
    }
  };

  const roleIcon = (role: string) => {
    if (role === 'lawyer') return <Balance sx={{ fontSize: 18, color: 'primary.main' }} />;
    if (role === 'admin') return <AdminPanelSettings sx={{ fontSize: 18, color: 'error.main' }} />;
    return <Person sx={{ fontSize: 18, color: 'text.secondary' }} />;
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, fontSize: { xs: '1.5rem', md: '2rem' } }}>Kullanıcılar</Typography>

      <TextField
        placeholder="Kullanıcı ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: <Search sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />,
          },
        }}
      />

      {isMobile ? (
        <Stack spacing={1.5}>
          {filtered.map((u) => (
            <Card key={u.id}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {roleIcon(u.role)}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                        {u.full_name ?? 'İsimsiz'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', wordBreak: 'break-all' }}>
                      {u.email ?? '-'}
                    </Typography>
                    {u.phone && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {u.phone}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Chip
                        size="small"
                        label={u.role === 'lawyer' ? 'Avukat' : u.role === 'admin' ? 'Admin' : 'Müvekkil'}
                        color={u.role === 'lawyer' ? 'primary' : u.role === 'admin' ? 'error' : 'default'}
                      />
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {new Date(u.created_at).toLocaleDateString('tr-TR')}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedUser(u); }}>
                    <MoreVert />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ad Soyad</TableCell>
                <TableCell>E-posta</TableCell>
                <TableCell>Telefon</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Kayıt Tarihi</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {roleIcon(u.role)}
                      {u.full_name ?? 'İsimsiz'}
                    </Box>
                  </TableCell>
                  <TableCell>{u.email ?? '-'}</TableCell>
                  <TableCell>{u.phone ?? '-'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={u.role === 'lawyer' ? 'Avukat' : u.role === 'admin' ? 'Admin' : 'Müvekkil'}
                      color={u.role === 'lawyer' ? 'primary' : u.role === 'admin' ? 'error' : 'default'} />
                  </TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedUser(u); }}>
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem disabled={loadingAction} onClick={() => handleRoleChange('client')}>Müvekkil Yap</MenuItem>
        <MenuItem disabled={loadingAction} onClick={() => handleRoleChange('lawyer')}>Avukat Yap</MenuItem>
        <MenuItem disabled={loadingAction} onClick={() => handleRoleChange('admin')}>Admin Yap</MenuItem>
        <Divider />
        <MenuItem disabled={loadingAction} onClick={handleDeleteUser} sx={{ color: 'error.main' }}>
          <Delete sx={{ fontSize: 18, mr: 1 }} />
          Kullanıcıyı Sil
        </MenuItem>
      </Menu>
    </Box>
  );
}
