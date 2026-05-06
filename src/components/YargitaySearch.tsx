'use client';

import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, CircularProgress,
  List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem, Pagination, Chip,
} from '@mui/material';
import { Search, Sort, Gavel, OpenInNew } from '@mui/icons-material';

interface YargitayDecision {
  id: string;
  daire: string;
  esasNo: string;
  kararNo: string;
  kararTarihi: string;
  arananKelime: string;
}

export default function YargitaySearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<YargitayDecision[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailHtml, setDetailHtml] = useState('');
  const [detailTitle, setDetailTitle] = useState('');

  const handleSearch = async (targetPage = 1) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/yargitay/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), pageSize, pageNumber: targetPage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Arama başarısız');
      setResults(data.items || []);
      setTotal(data.recordsFiltered || 0);
      setPage(targetPage);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (item: YargitayDecision) => {
    setDetailTitle(`${item.daire} - ${item.esasNo} / ${item.kararNo}`);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailHtml('');
    try {
      const res = await fetch('/api/yargitay/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fetchDetailId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Detay alınamadı');
      setDetailHtml(data.detail?.html || '');
    } catch (err: any) {
      setDetailHtml(`<p style="color:red">Hata: ${err.message}</p>`);
    } finally {
      setDetailLoading(false);
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    const dateA = new Date(a.kararTarihi.split('.').reverse().join('-')).getTime();
    const dateB = new Date(b.kararTarihi.split('.').reverse().join('-')).getTime();
    return sortDir === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Yargıtay Karar Sorgulama
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            placeholder="Anahtar kelime girin (örn: tapu, işçi, tazminat...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(1); }}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Search />}
            onClick={() => handleSearch(1)}
            disabled={loading || !query.trim()}
          >
            Ara
          </Button>
        </Box>

        {results.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {total} sonuç bulundu
            </Typography>
            <Button size="small" startIcon={<Sort />} onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}>
              Tarih: {sortDir === 'desc' ? 'Yeniden Eskiye' : 'Eskiden Yeniye'}
            </Button>
          </Box>
        )}

        <List>
          {sortedResults.map((item) => (
            <ListItem
              key={item.id}
              sx={{
                bgcolor: 'action.hover',
                borderRadius: 2,
                mb: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.selected' },
              }}
              onClick={() => handleOpenDetail(item)}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip size="small" icon={<Gavel fontSize="small" />} label={item.daire} color="primary" variant="outlined" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.esasNo} / {item.kararNo}
                    </Typography>
                  </Box>
                }
                secondary={`Karar Tarihi: ${item.kararTarihi || '-'}`}
              />
              <IconButton edge="end" title="Detay Görüntüle">
                <OpenInNew fontSize="small" />
              </IconButton>
            </ListItem>
          ))}
        </List>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => handleSearch(value)}
              color="primary"
            />
          </Box>
        )}
      </CardContent>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{detailTitle}</DialogTitle>
        <DialogContent sx={{ minHeight: 200 }}>
          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                '& table': { width: '100%', borderCollapse: 'collapse', mb: 2 },
                '& th, & td': { border: '1px solid #e5e7eb', p: 1, textAlign: 'left' },
                '& th': { bgcolor: '#f3f4f6' },
              }}
              dangerouslySetInnerHTML={{ __html: detailHtml }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
