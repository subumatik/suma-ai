'use client';

import { useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, FormControl, Select, MenuItem,
} from '@mui/material';

interface User {
  id: string
  full_name: string | null
  clinic_name: string | null
  role: string
  created_at: string
}

export default function UsersClient({ users }: { users: User[] }) {
  const router = useRouter()

  const handleRoleChange = async (userId: string, newRole: string) => {
    await fetch('/api/admin/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })
    router.refresh()
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Kullanıcılar</Typography>

      <Paper elevation={2} sx={{ borderRadius: 3, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>İsim</TableCell>
                <TableCell>Klinik</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Kayıt Tarihi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {u.full_name ?? 'İsimsiz'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                      {u.id.slice(0, 8)}
                    </Typography>
                  </TableCell>
                  <TableCell>{u.clinic_name ?? '-'}</TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="researcher">Araştırmacı</MenuItem>
                        <MenuItem value="doctor">Doktor</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString('tr-TR')}</TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Kullanıcı bulunmuyor.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}
