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
  ChatBubble, SmartToy, Delete, Edit, AutoAwesome
} from '@mui/icons-material';
import DocumentUpload from '@/components/DocumentUpload';
import ChatInterface from '@/components/ChatInterface';

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
  
  const [docToRename, setDocToRename] = useState<any>(null);
  const [newDocName, setNewDocName] = useState('');

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
        <Tab label="Notlar" icon={<ChatBubble sx={{ fontSize: 18 }} />} iconPosition="start" />
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

      {tab === 3 && (
        <ChatInterface caseId={dosya.id} />
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
      <Dialog open={!!docToRename} onClose={() => setDocToRename(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Belgeyi Yeniden Adlandır</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
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
    </Box>
  );
}
