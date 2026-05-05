'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Card, CardContent, Typography, Button, Chip, Tabs, Tab, TextField,
  List, ListItem, ListItemIcon, ListItemText, IconButton, Divider, Avatar,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, Grid,
} from '@mui/material';
import {
  Folder, CheckCircle, Download, Upload, Send, Schedule, Gavel, Description,
  ChatBubble, SmartToy,
} from '@mui/icons-material';

interface Props {
  dosya: any;
  documents: any[];
  statusUpdates: any[];
  messages: any[];
  statuses: any[];
  categories: any[];
  role: string;
  userId: string;
}

export default function CaseDetailClient({ dosya, documents, statusUpdates, messages, statuses, categories, role, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [newStatusId, setNewStatusId] = useState(dosya.status_id);
  const [statusDesc, setStatusDesc] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Asistan state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const otherId = dosya.lawyer_id === userId ? dosya.client_id : dosya.lawyer_id;
    await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: otherId,
      dosya_id: dosya.id,
      content: newMessage.trim(),
    });
    setNewMessage('');
    router.refresh();
  };

  const handleStatusUpdate = async () => {
    await supabase.from('dosya_status_updates').insert({
      dosya_id: dosya.id,
      status_id: newStatusId,
      description: statusDesc,
      updated_by: userId,
      hearing_date: hearingDate || null,
    });
    await supabase.from('dosyalar').update({ status_id: newStatusId }).eq('id', dosya.id);
    setOpenStatusDialog(false);
    setStatusDesc('');
    setHearingDate('');
    router.refresh();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('dosyaId', dosya.id);
    formData.append('file', file);

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setUploading(false);
      alert(data?.error ?? 'Yukleme hatasi');
      return;
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    router.refresh();
  };

  const handleAiAsk = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dosyaId: dosya.id, question: aiQuestion.trim() }),
      });
      const data = await res.json();
      if (data.answer) {
        setAiAnswer(data.answer);
      } else {
        setAiAnswer(data.error ?? 'Bir hata oluştu.');
      }
    } catch (err: any) {
      setAiAnswer('Bağlantı hatası: ' + err.message);
    }
    setAiLoading(false);
  };

  return (
    <Box>
      <Button onClick={() => router.push('/cases')} sx={{ mb: 2 }}>← Dosyalara Dön</Button>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{dosya.title}</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>{dosya.file_number ?? 'Dosya No: Belirtilmemiş'}</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={dosya.status?.name ?? '-'} sx={{ bgcolor: (dosya.status?.color ?? '#3B82F6') + '20', color: dosya.status?.color ?? '#3B82F6' }} />
                {dosya.category?.name && <Chip label={dosya.category.name} sx={{ bgcolor: (dosya.category.color ?? '#3B82F6') + '20', color: dosya.category.color ?? '#3B82F6' }} />}
                {dosya.court_name && <Chip icon={<Gavel sx={{ fontSize: 16 }} />} label={dosya.court_name} variant="outlined" />}
              </Box>
            </Box>
            {role !== 'client' && (
              <Button variant="outlined" onClick={() => setOpenStatusDialog(true)}>Durum Güncelle</Button>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Avukat</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{dosya.lawyer?.full_name ?? '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Müvekkil</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{dosya.client?.full_name ?? '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Mahkeme Dosya No</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{dosya.court_file_no ?? '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Son Güncelleme</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{new Date(dosya.updated_at).toLocaleDateString('tr-TR')}</Typography>
            </Grid>
          </Grid>

          {dosya.description && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>{dosya.description}</Typography>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Belgeler" icon={<Description sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Durum Geçmişi" icon={<Schedule sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Mesajlar" icon={<ChatBubble sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="AI Asistan" icon={<SmartToy sx={{ fontSize: 18 }} />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Dosya Belgeleri</Typography>
              <Button variant="outlined" startIcon={<Upload />} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? 'Yükleniyor...' : 'Belge Yükle'}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="application/pdf,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileUpload}
              />
            </Box>
            {documents.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>Henüz belge bulunmuyor.</Typography>
            ) : (
              <List>
                {documents.map((d) => (
                  <ListItem key={d.id} sx={{ bgcolor: 'action.hover', borderRadius: 2, mb: 1 }}>
                    <ListItemIcon><Description sx={{ color: 'primary.main' }} /></ListItemIcon>
                    <ListItemText
                      primary={d.file_name}
                      secondary={`${d.uploader?.full_name ?? 'Bilinmiyor'} · ${new Date(d.created_at).toLocaleDateString('tr-TR')}`}
                    />
                    <IconButton href={`/api/documents/${d.id}/download`}>
                      <Download />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Durum Geçmişi</Typography>
            {statusUpdates.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>Henüz durum güncellemesi bulunmuyor.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {statusUpdates.map((su) => (
                  <Box key={su.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Chip size="small" label={su.status?.name ?? '-'} sx={{ bgcolor: (su.status?.color ?? '#3B82F6') + '20', color: su.status?.color ?? '#3B82F6' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {new Date(su.created_at).toLocaleString('tr-TR')}
                      </Typography>
                    </Box>
                    {su.description && <Typography variant="body2" sx={{ mt: 1 }}>{su.description}</Typography>}
                    {su.hearing_date && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                        Duruşma: {new Date(su.hearing_date).toLocaleDateString('tr-TR')}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      Güncelleyen: {su.updater?.full_name ?? 'Bilinmiyor'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Dosya Mesajları</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 400, overflowY: 'auto', mb: 2, p: 1 }}>
              {messages.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>Henüz mesaj bulunmuyor.</Typography>
              ) : (
                messages.map((m) => (
                  <Box key={m.id} sx={{ alignSelf: m.sender_id === userId ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                    <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: m.sender_id === userId ? 'primary.main' : 'action.hover', color: m.sender_id === userId ? '#fff' : 'inherit' }}>
                      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>{m.sender?.full_name}</Typography>
                      <Typography variant="body2">{m.content}</Typography>
                    </Paper>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25, textAlign: m.sender_id === userId ? 'right' : 'left' }}>
                      {new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth placeholder="Mesajınızı yazın..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} size="small" multiline maxRows={3} />
              <Button variant="contained" onClick={handleSendMessage} disabled={!newMessage.trim()}><Send sx={{ fontSize: 18 }} /></Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {tab === 3 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <SmartToy sx={{ color: 'primary.main', fontSize: 32 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>AI Asistan</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Dosyanız hakkında soru sorun, Claude analiz etsin</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Örn: Bu dosyada eksik evrak var mı?"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiAsk(); } }}
                multiline
                maxRows={3}
              />
              <Button variant="contained" onClick={handleAiAsk} disabled={aiLoading || !aiQuestion.trim()}>
                {aiLoading ? 'Düşünüyor...' : 'Sor'}
              </Button>
            </Box>

            {aiAnswer && (
              <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>Claude Yanıtı</Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{aiAnswer}</Typography>
              </Paper>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Durum Güncelle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField select label="Yeni Durum" fullWidth value={newStatusId} onChange={(e) => setNewStatusId(e.target.value)}
            slotProps={{ select: { native: true } }}>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </TextField>
          <TextField label="Açıklama" fullWidth multiline rows={2} value={statusDesc} onChange={(e) => setStatusDesc(e.target.value)} />
          <TextField label="Duruşma Tarihi" type="datetime-local" fullWidth value={hearingDate} onChange={(e) => setHearingDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>İptal</Button>
          <Button variant="contained" onClick={handleStatusUpdate}>Güncelle</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
