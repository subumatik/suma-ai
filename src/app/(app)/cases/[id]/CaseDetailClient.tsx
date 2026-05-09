'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Card, CardContent, Typography, Button, Chip, Tabs, Tab, TextField,
  List, ListItem, ListItemIcon, ListItemText, IconButton, Divider,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Snackbar, Alert, useMediaQuery, useTheme, Stack,
} from '@mui/material';
import {
  Download, Send, Schedule, Gavel, Description,
  ChatBubble, SmartToy, Delete, Edit, Add, Calculate,
  NotificationsActive, PersonAdd,
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
  appointments: any[];
  allClients: any[];
  allLawyers: any[];
  role: string;
  userId: string;
  userName: string;
}

export default function CaseDetailClient({
  dosya, documents, statusUpdates, messages: initialMessages, statuses,
  hearings: initialHearings, appointments: initialAppointments,
  allClients, allLawyers,
  role, userId, userName,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Extract lawyers and clients arrays from dosya
  const dosyaLawyers: any[] = (dosya.lawyers ?? []).map((l: any) => l.lawyer).filter(Boolean);
  const dosyaClients: any[] = (dosya.clients ?? []).map((c: any) => c.client).filter(Boolean);
  const isLawyerOnCase = dosyaLawyers.some((l: any) => l.id === userId);
  const isClientOnCase = dosyaClients.some((c: any) => c.id === userId);

  const [tab, setTab] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [newStatusId, setNewStatusId] = useState(dosya.status_id);
  const [statusDesc, setStatusDesc] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
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

  // Add lawyer/client to case
  const [openAddLawyerDialog, setOpenAddLawyerDialog] = useState(false);
  const [openAddClientDialog, setOpenAddClientDialog] = useState(false);
  const [selectedLawyerId, setSelectedLawyerId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Appointment creation inside case detail
  const [openAppointmentDialog, setOpenAppointmentDialog] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    lawyer_id: '',
    client_id: '',
    topic: '',
    notes: '',
    appointment_date: '',
    duration_minutes: 60,
    sendEmail: true,
  });
  const [appointmentLoading, setAppointmentLoading] = useState(false);

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

  const handleAddLawyer = async () => {
    if (!selectedLawyerId) return;
    setAddLoading(true);
    const { error } = await supabase.from('dosya_lawyers').insert({ dosya_id: dosya.id, lawyer_id: selectedLawyerId });
    setAddLoading(false);
    if (error) {
      showToast('Avukat eklenemedi: ' + error.message, 'error');
    } else {
      showToast('Avukat başarıyla eklendi.');
      setOpenAddLawyerDialog(false);
      setSelectedLawyerId('');
      router.refresh();
    }
  };

  const handleAddClient = async () => {
    if (!selectedClientId) return;
    setAddLoading(true);
    const { error } = await supabase.from('dosya_clients').insert({ dosya_id: dosya.id, client_id: selectedClientId });
    setAddLoading(false);
    if (error) {
      showToast('Müvekkil eklenemedi: ' + error.message, 'error');
    } else {
      showToast('Müvekkil başarıyla eklendi.');
      setOpenAddClientDialog(false);
      setSelectedClientId('');
      router.refresh();
    }
  };

  const handleCreateAppointment = async () => {
    if (!appointmentForm.lawyer_id || !appointmentForm.client_id || !appointmentForm.topic || !appointmentForm.appointment_date) {
      showToast('Lütfen tüm zorunlu alanları doldurun.', 'error');
      return;
    }
    setAppointmentLoading(true);
    try {
      const res = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lawyer_id: appointmentForm.lawyer_id,
          client_id: appointmentForm.client_id,
          dosya_id: dosya.id,
          appointment_date: new Date(appointmentForm.appointment_date).toISOString(),
          duration_minutes: appointmentForm.duration_minutes,
          topic: appointmentForm.topic,
          notes: appointmentForm.notes,
          status: 'CONFIRMED',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Randevu oluşturulamadı');
      showToast('Randevu oluşturuldu.');
      setOpenAppointmentDialog(false);
      setAppointmentForm({
        lawyer_id: '', client_id: '', topic: '', notes: '', appointment_date: '', duration_minutes: 60, sendEmail: true,
      });
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleRenameDocument = async () => {
    if (role === 'client') return;
    if (!newDocName.trim() || !docToRename) return;
    await supabase.from('dosya_documents').update({ file_name: newDocName }).eq('id', docToRename.id);
    setDocToRename(null);
    setNewDocName('');
    router.refresh();
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (role === 'client') return;
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
    if (filePath) await supabase.storage.from('case-documents').remove([filePath]);
    await supabase.from('dosya_documents').delete().eq('id', docId);
    router.refresh();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const allParticipantIds = [
      ...dosyaLawyers.map((l: any) => l.id),
      ...dosyaClients.map((c: any) => c.id),
    ].filter((id) => id !== userId);

    if (allParticipantIds.length === 0) {
      showToast('Bu dosyada başka katılımcı yok.', 'error');
      return;
    }

    const inserts = allParticipantIds.map((rid) => ({
      sender_id: userId,
      receiver_id: rid,
      dosya_id: dosya.id,
      content: newMessage.trim(),
    }));
    await supabase.from('messages').insert(inserts);
    setNewMessage('');
  };

  const handleStatusUpdate = async () => {
    if (role === 'client') return;
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

  const handleCreateHearing = async () => {
    if (role === 'client') return;
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
    if (role === 'client') return;
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
    if (role === 'client') return;
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

  // Visible-as-client only when user is a client on this case (not a lawyer)
  const viewAsClient = role === 'client' || (!isLawyerOnCase && isClientOnCase);

  return (
    <Box>
      <Button onClick={() => router.push('/cases')} sx={{ mb: 2 }}>← Dosyalara Dön</Button>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, wordBreak: 'break-word', fontSize: { xs: '1.5rem', md: '2rem' } }}>{dosya.title}</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1, wordBreak: 'break-word' }}>{dosya.file_number ?? 'Dosya No: Belirtilmemiş'}</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={dosya.status?.name ?? '-'} sx={{ bgcolor: (dosya.status?.color ?? '#3B82F6') + '20', color: dosya.status?.color ?? '#3B82F6' }} />
                {dosya.category?.name && <Chip label={dosya.category.name} sx={{ bgcolor: (dosya.category.color ?? '#3B82F6') + '20', color: dosya.category.color ?? '#3B82F6' }} />}
                {dosya.court_name && <Chip icon={<Gavel sx={{ fontSize: 16 }} />} label={dosya.court_name} variant="outlined" />}
              </Box>
            </Box>
            {!viewAsClient && (
              <Button variant="outlined" onClick={() => setOpenStatusDialog(true)} fullWidth={isMobile}>Durum Güncelle</Button>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Avukat(lar)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                    {dosyaLawyers.length === 0 ? '-' : dosyaLawyers.map((l: any) => l.full_name).filter(Boolean).join(', ')}
                  </Typography>
                </Box>
                {role === 'lawyer' && isLawyerOnCase && (
                  <Button size="small" startIcon={<PersonAdd />} onClick={() => setOpenAddLawyerDialog(true)} sx={{ flexShrink: 0 }}>
                    Ekle
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Müvekkil(ler)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                    {dosyaClients.length === 0 ? '-' : dosyaClients.map((c: any) => c.full_name).filter(Boolean).join(', ')}
                  </Typography>
                </Box>
                {role === 'lawyer' && isLawyerOnCase && (
                  <Button size="small" startIcon={<PersonAdd />} onClick={() => setOpenAddClientDialog(true)} sx={{ flexShrink: 0 }}>
                    Ekle
                  </Button>
                )}
              </Box>
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
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, wordBreak: 'break-word' }}>{dosya.description}</Typography>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2 }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        {viewAsClient ? [
          <Tab key="durusmalar" label="Duruşmalar" icon={<Gavel sx={{ fontSize: 18 }} />} iconPosition="start" />,
          <Tab key="notlar" label="Notlar" icon={<ChatBubble sx={{ fontSize: 18 }} />} iconPosition="start" />,
          <Tab key="randevular" label="Randevular" icon={<Schedule sx={{ fontSize: 18 }} />} iconPosition="start" />,
        ] : [
          <Tab key="belgeler" label="Belgeler" icon={<Description sx={{ fontSize: 18 }} />} iconPosition="start" />,
          <Tab key="durum" label="Durum Geçmişi" icon={<Schedule sx={{ fontSize: 18 }} />} iconPosition="start" />,
          <Tab key="durusmalar" label="Duruşmalar" icon={<Gavel sx={{ fontSize: 18 }} />} iconPosition="start" />,
          <Tab key="notlar" label="Notlar" icon={<ChatBubble sx={{ fontSize: 18 }} />} iconPosition="start" />,
          <Tab key="hesaplama" label="Hesaplama" icon={<Calculate sx={{ fontSize: 18 }} />} iconPosition="start" />,
          <Tab key="yargitay" label="Yargıtay" icon={<Gavel sx={{ fontSize: 18 }} />} iconPosition="start" />,
          <Tab key="ai" label="AI Asistan" icon={<SmartToy sx={{ fontSize: 18 }} />} iconPosition="start" />,
          <Tab key="randevular" label="Randevular" icon={<Schedule sx={{ fontSize: 18 }} />} iconPosition="start" />,
        ]}
      </Tabs>

      {viewAsClient ? (
        <>
          {tab === 0 && (
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Duruşmalar</Typography>
                {hearings.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>Henüz duruşma kaydı bulunmuyor.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {hearings.map((h) => (
                      <Box key={h.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', borderLeft: '4px solid', borderColor: 'warning.main' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {new Date(h.hearing_date).toLocaleString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        {h.court_name && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            <strong>Mahkeme:</strong> {h.court_name}
                          </Typography>
                        )}
                        {h.description && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, wordBreak: 'break-word' }}>
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
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}

          {tab === 1 && (
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Dosya Notları</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 400, overflowY: 'auto', mb: 2, p: 1 }}>
                  {messages.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>Henüz not bulunmuyor.</Typography>
                  ) : (
                    messages.map((m) => (
                      <Box key={m.id} sx={{ alignSelf: m.sender_id === userId ? 'flex-end' : 'flex-start', maxWidth: { xs: '90%', md: '80%' } }}>
                        <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: m.sender_id === userId ? 'primary.main' : 'action.hover', color: m.sender_id === userId ? '#fff' : 'inherit' }}>
                          <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>{m.sender?.full_name}</Typography>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{m.content}</Typography>
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

          {tab === 2 && (
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Randevular</Typography>
                  {role === 'lawyer' && isLawyerOnCase && (
                    <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpenAppointmentDialog(true)}>Randevu Ekle</Button>
                  )}
                </Box>
                {initialAppointments.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Schedule sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>Henüz randevu bulunmuyor.</Typography>
                    {role === 'lawyer' && isLawyerOnCase && (
                      <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => setOpenAppointmentDialog(true)}>Randevu Ekle</Button>
                    )}
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {initialAppointments.map((a) => (
                      <Box key={a.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', borderLeft: '4px solid', borderColor: a.status === 'CONFIRMED' ? 'success.main' : a.status === 'REQUESTED' ? 'warning.main' : 'text.disabled' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {new Date(a.appointment_date).toLocaleString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          <strong>Konu:</strong> {a.topic || '-'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          <strong>Süre:</strong> {a.duration_minutes} dakika
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Chip size="small" label={a.status === 'CONFIRMED' ? 'Onaylandı' : a.status === 'REQUESTED' ? 'Talep Edildi' : a.status === 'CANCELLED' ? 'İptal' : 'Tamamlandı'} color={a.status === 'CONFIRMED' ? 'success' : a.status === 'REQUESTED' ? 'warning' : a.status === 'CANCELLED' ? 'error' : 'info'} />
                          <Chip size="small" variant="outlined" label={`Avukat: ${a.lawyer?.full_name ?? '-'}`} />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {tab === 0 && (
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Dosya Belgeleri</Typography>

                <Box sx={{ mb: 4 }}>
                  <DocumentUpload caseId={dosya.id} onUploadSuccess={() => router.refresh()} />
                </Box>

                {documents.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>Henüz yüklenmiş belge bulunmuyor.</Typography>
                ) : (
                  <List>
                    {documents.map((d) => (
                      <ListItem key={d.id} sx={{ bgcolor: 'action.hover', borderRadius: 2, mb: 1, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
                        <ListItemIcon sx={{ minWidth: 'auto' }}><Description sx={{ color: 'primary.main' }} /></ListItemIcon>
                        <ListItemText
                          primary={d.file_name}
                          secondary={`${d.uploader?.full_name ?? 'Bilinmiyor'} · ${new Date(d.created_at).toLocaleDateString('tr-TR')}`}
                          sx={{ wordBreak: 'break-word' }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                          <IconButton href={`/api/documents/${d.id}/download`} title="İndir" size={isMobile ? 'medium' : 'small'}>
                            <Download />
                          </IconButton>
                          <IconButton onClick={() => { setDocToRename(d); setNewDocName(d.file_name); }} title="Yeniden Adlandır" size={isMobile ? 'medium' : 'small'}>
                            <Edit />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteDocument(d.id, d.file_url)} title="Sil" color="error" size={isMobile ? 'medium' : 'small'}>
                            <Delete />
                          </IconButton>
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
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Durum Geçmişi</Typography>
                {statusUpdates.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>Henüz durum güncellemesi bulunmuyor.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {statusUpdates.map((su) => (
                      <Box key={su.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, flexWrap: 'wrap', gap: 1 }}>
                          <Chip size="small" label={su.status?.name ?? '-'} sx={{ bgcolor: (su.status?.color ?? '#3B82F6') + '20', color: su.status?.color ?? '#3B82F6' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {new Date(su.created_at).toLocaleString('tr-TR')}
                          </Typography>
                        </Box>
                        {su.description && <Typography variant="body2" sx={{ mt: 1, wordBreak: 'break-word' }}>{su.description}</Typography>}
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
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}

          {tab === 2 && (
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Duruşmalar</Typography>
                  <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpenHearingDialog(true)}>
                    Yeni Duruşma Ekle
                  </Button>
                </Box>

                {hearings.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>Henüz duruşma kaydı bulunmuyor.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {hearings.map((h) => (
                      <Box key={h.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', borderLeft: '4px solid', borderColor: 'warning.main' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {new Date(h.hearing_date).toLocaleString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                            {h.court_name && (
                              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                <strong>Mahkeme:</strong> {h.court_name}
                              </Typography>
                            )}
                            {h.description && (
                              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, wordBreak: 'break-word' }}>
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
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<NotificationsActive />}
                              onClick={() => handleSendReminder(h.id)}
                              disabled={h.reminder_email_sent}
                            >
                              Hatırlatma
                            </Button>
                            <IconButton color="error" onClick={() => handleDeleteHearing(h.id)} title="Sil">
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}

          {tab === 3 && (
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Dosya Notları</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 400, overflowY: 'auto', mb: 2, p: 1 }}>
                  {messages.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>Henüz not bulunmuyor.</Typography>
                  ) : (
                    messages.map((m) => (
                      <Box key={m.id} sx={{ alignSelf: m.sender_id === userId ? 'flex-end' : 'flex-start', maxWidth: { xs: '90%', md: '80%' } }}>
                        <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: m.sender_id === userId ? 'primary.main' : 'action.hover', color: m.sender_id === userId ? '#fff' : 'inherit' }}>
                          <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>{m.sender?.full_name}</Typography>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{m.content}</Typography>
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

          {tab === 7 && (
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Randevular</Typography>
                  {role === 'lawyer' && isLawyerOnCase && (
                    <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpenAppointmentDialog(true)}>Randevu Ekle</Button>
                  )}
                </Box>
                {initialAppointments.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Schedule sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>Henüz randevu bulunmuyor.</Typography>
                    {role === 'lawyer' && isLawyerOnCase && (
                      <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => setOpenAppointmentDialog(true)}>Randevu Ekle</Button>
                    )}
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {initialAppointments.map((a) => (
                      <Box key={a.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', borderLeft: '4px solid', borderColor: a.status === 'CONFIRMED' ? 'success.main' : a.status === 'REQUESTED' ? 'warning.main' : 'text.disabled' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {new Date(a.appointment_date).toLocaleString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          <strong>Konu:</strong> {a.topic || '-'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          <strong>Süre:</strong> {a.duration_minutes} dakika
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Chip size="small" label={a.status === 'CONFIRMED' ? 'Onaylandı' : a.status === 'REQUESTED' ? 'Talep Edildi' : a.status === 'CANCELLED' ? 'İptal' : 'Tamamlandı'} color={a.status === 'CONFIRMED' ? 'success' : a.status === 'REQUESTED' ? 'warning' : a.status === 'CANCELLED' ? 'error' : 'info'} />
                          <Chip size="small" variant="outlined" label={`Müvekkil: ${a.client?.full_name ?? '-'}`} />
                          <Chip size="small" variant="outlined" label={`Avukat: ${a.lawyer?.full_name ?? '-'}`} />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
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
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setOpenStatusDialog(false)}>İptal</Button>
          <Button variant="contained" onClick={handleStatusUpdate}>Güncelle</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openHearingDialog} onClose={() => setOpenHearingDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
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
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setOpenHearingDialog(false)}>İptal</Button>
          <Button variant="contained" onClick={handleCreateHearing} disabled={hearingLoading}>
            {hearingLoading ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!docToRename} onClose={() => setDocToRename(null)} maxWidth="sm" fullWidth fullScreen={isMobile}>
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
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setDocToRename(null)}>İptal</Button>
          <Button variant="contained" onClick={handleRenameDocument} disabled={!newDocName.trim()}>Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* Add Lawyer Dialog */}
      <Dialog open={openAddLawyerDialog} onClose={() => setOpenAddLawyerDialog(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Avukat Ekle</DialogTitle>
        <DialogContent sx={{ pt: 2, overflow: 'visible' }}>
          <TextField
            select
            label="Avukat Seçin"
            fullWidth
            value={selectedLawyerId}
            onChange={(e) => setSelectedLawyerId(e.target.value)}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">Seçiniz</option>
            {allLawyers
              .filter((l: any) => !dosyaLawyers.some((dl: any) => dl.id === l.id))
              .map((l: any) => (
                <option key={l.id} value={l.id}>{l.full_name}{l.specialization ? ` - ${l.specialization}` : ''}</option>
              ))}
          </TextField>
          {allLawyers.filter((l: any) => !dosyaLawyers.some((dl: any) => dl.id === l.id)).length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>Eklenebilecek avukat kalmadı.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setOpenAddLawyerDialog(false)}>İptal</Button>
          <Button variant="contained" onClick={handleAddLawyer} disabled={addLoading || !selectedLawyerId}>Ekle</Button>
        </DialogActions>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={openAddClientDialog} onClose={() => setOpenAddClientDialog(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Müvekkil Ekle</DialogTitle>
        <DialogContent sx={{ pt: 2, overflow: 'visible' }}>
          <TextField
            select
            label="Müvekkil Seçin"
            fullWidth
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">Seçiniz</option>
            {allClients
              .filter((c: any) => !dosyaClients.some((dc: any) => dc.id === c.id))
              .map((c: any) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
          </TextField>
          {allClients.filter((c: any) => !dosyaClients.some((dc: any) => dc.id === c.id)).length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>Eklenebilecek müvekkil kalmadı.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setOpenAddClientDialog(false)}>İptal</Button>
          <Button variant="contained" onClick={handleAddClient} disabled={addLoading || !selectedClientId}>Ekle</Button>
        </DialogActions>
      </Dialog>

      {/* Create Appointment Dialog */}
      <Dialog open={openAppointmentDialog} onClose={() => setOpenAppointmentDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Yeni Randevu Oluştur</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, overflow: 'visible' }}>
          <TextField
            select
            label="Avukat"
            fullWidth
            value={appointmentForm.lawyer_id}
            onChange={(e) => setAppointmentForm({ ...appointmentForm, lawyer_id: e.target.value })}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">Seçiniz</option>
            {dosyaLawyers.map((l: any) => (
              <option key={l.id} value={l.id}>{l.full_name}</option>
            ))}
          </TextField>
          <TextField
            select
            label="Müvekkil"
            fullWidth
            value={appointmentForm.client_id}
            onChange={(e) => setAppointmentForm({ ...appointmentForm, client_id: e.target.value })}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">Seçiniz</option>
            {dosyaClients.map((c: any) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </TextField>
          <TextField label="Konu" fullWidth value={appointmentForm.topic} onChange={(e) => setAppointmentForm({ ...appointmentForm, topic: e.target.value })} />
          <TextField
            label="Tarih ve Saat"
            type="datetime-local"
            fullWidth
            value={appointmentForm.appointment_date}
            onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField label="Süre (dk)" type="number" fullWidth value={appointmentForm.duration_minutes} onChange={(e) => setAppointmentForm({ ...appointmentForm, duration_minutes: parseInt(e.target.value) || 60 })} />
          <TextField label="Notlar" fullWidth multiline rows={2} value={appointmentForm.notes} onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setOpenAppointmentDialog(false)}>İptal</Button>
          <Button variant="contained" onClick={handleCreateAppointment} disabled={appointmentLoading || !appointmentForm.lawyer_id || !appointmentForm.client_id || !appointmentForm.topic || !appointmentForm.appointment_date}>
            {appointmentLoading ? 'Oluşturuluyor...' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
