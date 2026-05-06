'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Card, CardContent, Typography, Button, Chip, Tabs, Tab, TextField,
  List, ListItem, ListItemIcon, ListItemText, IconButton, Divider, Avatar,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Snackbar, Alert,
} from '@mui/material';
import {
  Folder, CheckCircle, Download, Upload, Send, Schedule, Gavel, Description,
  ChatBubble, SmartToy, Delete, Edit, AutoAwesome, Add, Calculate,
  NotificationsActive,
} from '@mui/icons-material';
import DocumentUpload from '@/components/DocumentUpload';
import ChatInterface from '@/components/ChatInterface';
import EnforcementCalculator from '@/components/EnforcementCalculator';
import YargitaySearch from '@/components/YargitaySearch';

interface Props {
  dosya: any;
  documents: any[];
  statusUpdates: any[];
  messages: any[];
  statuses: any[];
  categories: any[];
  hearings: any[];
  role: string;
  userId: string;
  userName: string;
}

export default function CaseDetailClient({ dosya, documents, statusUpdates, messages: initialMessages, statuses, categories, hearings: initialHearings, role, userId, userName }: Props) {
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
  const [messages, setMessages] = useState(initialMessages);

  const [docToRename, setDocToRename] = useState<any>(null);
  const [newDocName, setNewDocName] = useState('');

  // Hearings state
  const [hearings, setHearings] = useState(initialHearings);
  const [openHearingDialog, setOpenHearingDialog] = useState(false);
  const [newHearing, setNewHearing] = useState({ hearing_date: '', court_name: '', description: '', reminder_days_before: '' });
  const [hearingLoading, setHearingLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const channel = supabase
      .channel('case-messages-' + dosya.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `dosya_id=eq.${dosya.id}` },
        (payload) => {
          const msg = payload.new as any;
          setMessages((prev) => {
            if (prev.find((p) => p.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, dosya.id]);

  const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleRenameDocument = async () => {
    if (!newDocName.trim() || !docToRename) return;
    await supabase.from('dosya_documents').update({ file_name: newDocName }).eq('id', docToRename.id);
    setDocToRename(null);
    setNewDocName('');
    router.refresh();
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
    if (filePath) await supabase.storage.from('case-documents').remove([filePath]);
    await supabase.from('dosya_documents').delete().eq('id', docId);
    router.refresh();
  };

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

  // Hearing handlers
  const handleCreateHearing = async () => {
    if (!newHearing.hearing_date) {
      showToast('Duruşma tarihi zorunludur.', 'error');
      return;
    }
    setHearingLoading(true);
    try {
      const res = await fetch('/api/hearings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dosya_id: dosya.id,
          hearing_date: new Date(newHearing.hearing_date).toISOString(),
          court_name: newHearing.court_name,
          description: newHearing.description,
          reminder_days_before: newHearing.reminder_days_before ? parseInt(newHearing.reminder_days_before) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duruşma eklenemedi');
      setHearings((prev) => [...prev, data.hearing].sort((a, b) => new Date(a.hearing_date).getTime() - new Date(b.hearing_date).getTime()));
      setOpenHearingDialog(false);
      setNewHearing({ hearing_date: '', court_name: '', description: '', reminder_days_before: '' });
      showToast('Duruşma eklendi.');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setHearingLoading(false);
    }
  };

  const handleDeleteHearing = async (id: string) => {
    if (!confirm('Bu duruşmayı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/hearings/delete?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silinemedi');
      setHearings((prev) => prev.filter((h) => h.id !== id));
      showToast('Duruşma silindi.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSendReminder = async (hearingId: string) => {
    try {
      const res = await fetch('/api/hearings/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hearing_id: hearingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hatırlatma gönderilemedi');
      showToast(`Hatırlatma e-postası gönderildi: ${data.sentTo?.join(', ')}`);
      setHearings((prev) => prev.map((h) => (h.id === hearingId ? { ...h, reminder_email_sent: true } : h)));
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <Box>
      <Button onClick={() => router.push('/cases')} sx={{ mb: 2 }}>← Dosyalara Dön</Button>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{dosya.title}</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{dosya.file_number ?? 'Dosya No: Belirtilmemiş'}</Typography>
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
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{dosya.description}</Typography>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Belgeler" icon={<Description sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Durum Geçmişi" icon={<Schedule sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Duruşmalar" icon={<Gavel sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Notlar" icon={<ChatBubble sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Hesaplama" icon={<Calculate sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Yargıtay" icon={<Gavel sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="AI Asistan" icon={<SmartToy sx={{ fontSize: 18 }} />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Dosya Belgeleri</Typography>

            <Box sx={{ mb: 4 }}>
              <DocumentUpload caseId={dosya.id} onUploadSuccess={() => router.refresh()} />
            </Box>

            {documents.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>Henüz yüklenmiş belge bulunmuyor.</Typography>
            ) : (
              <List>
                {documents.map((d) => (
                  <ListItem key={d.id} sx={{ bgcolor: 'action.hover', borderRadius: 2, mb: 1 }}>
                    <ListItemIcon><Description sx={{ color: 'primary.main' }} /></ListItemIcon>
                    <ListItemText
                      primary={d.file_name}
                      secondary={`${d.uploader?.full_name ?? 'Bilinmiyor'} · ${new Date(d.created_at).toLocaleDateString('tr-TR')}`}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton href={`/api/documents/${d.id}/download`} title="İndir">
                        <Download />
                      </IconButton>
                      {role !== 'client' && (
                        <>
                          <IconButton onClick={() => { setDocToRename(d); setNewDocName(d.file_name); }} title="Yeniden Adlandır">
                            <Edit />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteDocument(d.id, d.file_url)} title="Sil" color="error">
                            <Delete />
                          </IconButton>
                        </>
                      )}
                    </Box>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Duruşmalar</Typography>
              {role !== 'client' && (
                <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpenHearingDialog(true)}>
                  Yeni Duruşma Ekle
                </Button>
              )}
            </Box>

            {hearings.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>Henüz duruşma kaydı bulunmuyor.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {hearings.map((h) => (
                  <Box key={h.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', borderLeft: '4px solid', borderColor: 'warning.main' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {new Date(h.hearing_date).toLocaleString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        {h.court_name && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            <strong>Mahkeme:</strong> {h.court_name}
                          </Typography>
                        )}
                        {h.description && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {h.description}
                          </Typography>
                        )}
                        {h.reminder_days_before && (
                          <Chip size="small" label={`${h.reminder_days_before} gün önce hatırlat`} sx={{ mt: 1 }} />
                        )}
                        {h.reminder_email_sent && (
                          <Chip size="small" label="Hatırlatma gönderildi" color="success" sx={{ mt: 1, ml: 1 }} />
                        )}
                      </Box>
                      {role !== 'client' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<NotificationsActive />}
                            onClick={() => handleSendReminder(h.id)}
                            disabled={h.reminder_email_sent}
                          >
                            Hatırlatma Gönder
                          </Button>
                          <IconButton color="error" onClick={() => handleDeleteHearing(h.id)} title="Sil">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 3 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Dosya Notları</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 400, overflowY: 'auto', mb: 2, p: 1 }}>
              {messages.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>Henüz not bulunmuyor.</Typography>
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
              <TextField fullWidth placeholder="Notunuzu yazın..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} size="small" multiline maxRows={3} />
              <Button variant="contained" onClick={handleSendMessage} disabled={!newMessage.trim()}><Send sx={{ fontSize: 18 }} /></Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {tab === 4 && <EnforcementCalculator />}

      {tab === 5 && <YargitaySearch />}

      {tab === 6 && (
        <ChatInterface caseId={dosya.id} userId={userId} userName={userName} />
      )}

      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Durum Güncelle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, overflow: 'visible' }}>
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

      <Dialog open={openHearingDialog} onClose={() => setOpenHearingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Duruşma Ekle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, overflow: 'visible' }}>
          <TextField
            label="Duruşma Tarihi"
            type="datetime-local"
            fullWidth
            value={newHearing.hearing_date}
            onChange={(e) => setNewHearing({ ...newHearing, hearing_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Mahkeme"
            fullWidth
            value={newHearing.court_name}
            onChange={(e) => setNewHearing({ ...newHearing, court_name: e.target.value })}
          />
          <TextField
            label="Açıklama"
            fullWidth
            multiline
            rows={2}
            value={newHearing.description}
            onChange={(e) => setNewHearing({ ...newHearing, description: e.target.value })}
          />
          <TextField
            select
            label="E-posta Hatırlatma"
            fullWidth
            value={newHearing.reminder_days_before}
            onChange={(e) => setNewHearing({ ...newHearing, reminder_days_before: e.target.value })}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">Hatırlatma yok</option>
            <option value="1">1 gün önce</option>
            <option value="2">2 gün önce</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHearingDialog(false)}>İptal</Button>
          <Button variant="contained" onClick={handleCreateHearing} disabled={hearingLoading}>
            {hearingLoading ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!docToRename} onClose={() => setDocToRename(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Belgeyi Yeniden Adlandır</DialogTitle>
        <DialogContent sx={{ pt: 2, overflow: 'visible' }}>
          <TextField
            fullWidth
            label="Belge Adı"
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocToRename(null)}>İptal</Button>
          <Button variant="contained" onClick={handleRenameDocument} disabled={!newDocName.trim()}>Kaydet</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
