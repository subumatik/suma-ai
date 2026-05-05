'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Card, CardContent, Typography, TextField, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Menu, MenuItem,
} from '@mui/material';
import { Search, MoreVert, Balance, Person, AdminPanelSettings } from '@mui/icons-material';

interface UsersClientProps {
  users: any[];
}

export default function UsersClient({ users }: UsersClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  const handleRoleChange = async (role: string) => {
    if (!selectedUser) return;
    await supabase.from('profiles').update({ role }).eq('id', selectedUser.id);
    setAnchorEl(null);
    setSelectedUser(null);
    router.refresh();
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Kullanıcılar</Typography>

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
                    {u.role === 'lawyer' ? <Balance sx={{ fontSize: 18, color: 'primary.main' }} /> :
                     u.role === 'admin' ? <AdminPanelSettings sx={{ fontSize: 18, color: 'error.main' }} /> :
                     <Person sx={{ fontSize: 18, color: 'text.secondary' }} />}
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

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleRoleChange('client')}>Müvekkil Yap</MenuItem>
        <MenuItem onClick={() => handleRoleChange('lawyer')}>Avukat Yap</MenuItem>
        <MenuItem onClick={() => handleRoleChange('admin')}>Admin Yap</MenuItem>
      </Menu>
    </Box>
  );
}
