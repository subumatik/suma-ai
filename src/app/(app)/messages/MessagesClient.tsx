'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Snackbar, Alert, Avatar, Badge, IconButton,
  useMediaQuery, useTheme, Menu, MenuItem,
} from '@mui/material';
import {
  PersonAdd, Send, ArrowBack, Chat, MoreVert, Edit, Delete, DeleteForever,
} from '@mui/icons-material';

interface MessagesClientProps {
  userId: string;
  userName: string;
  role: string;
  contacts: any[];
  allUsers: any[];
  messages: any[];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function MessagesClient({ userId, userName, role, contacts, allUsers, messages }: MessagesClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('u');

  const [selectedId, setSelectedId] = useState<string | null>(initialUserId ?? null);
  const [visibleCount, setVisibleCount] = useState(30);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Message action menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [editMsgId, setEditMsgId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'me' | 'all'>('me');
  const [deleteMsgId, setDeleteMsgId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contactMap = useMemo(() => {
    const map = new Map<string, any>();
    allUsers.forEach((u) => map.set(u.id, u));
    return map;
  }, [allUsers]);

  // Conversations derived from allUsers
  const conversations = useMemo(() => {
    return allUsers.map((u) => {
      const contactName = u.full_name ?? 'Kullanıcı';
      const subtitle = u.role === 'lawyer'
        ? (u.specialization ? `Avukat · ${u.specialization}` : 'Avukat')
        : 'Müvekkil';

      const convMessages = messages.filter(
        (m) => (m.sender_id === userId && m.receiver_id === u.id) || (m.sender_id === u.id && m.receiver_id === userId)
      );
      const unreadCount = convMessages.filter((m) => m.sender_id === u.id && m.receiver_id === userId && !m.is_read).length;
      const lastMsg = convMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      return {
        id: u.id,
        name: contactName,
        subtitle,
        avatarColor: u.role === 'lawyer' ? '#1E3A5F' : '#C9A227',
        unreadCount,
        lastMessage: lastMsg?.content ?? '',
        lastMessageAt: lastMsg?.created_at,
      };
    }).sort((a, b) => {
      if (a.unreadCount && !b.unreadCount) return -1;
      if (!a.unreadCount && b.unreadCount) return 1;
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [allUsers, messages, userId]);

  // Filtered messages for selected conversation with visibility rules
  const allActiveMessages = useMemo(() => {
    if (!selectedId) return [];
    return messages
      .filter(
        (m) => (m.sender_id === userId && m.receiver_id === selectedId) || (m.sender_id === selectedId && m.receiver_id === userId)
      )
      .filter((m) => {
        // "Benden sil" filter
        if (m.sender_id === userId && m.deleted_by_sender) return false;
        if (m.receiver_id === userId && m.deleted_by_receiver) return false;
        return true;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, selectedId, userId]);

  const hasMore = allActiveMessages.length > visibleCount;
  const activeMessages = useMemo(() => {
    return allActiveMessages.slice(Math.max(0, allActiveMessages.length - visibleCount));
  }, [allActiveMessages, visibleCount]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (!selectedId) return;
    const markRead = async () => {
      const { error } = await supabase.from('messages').update({ is_read: true }).eq('sender_id', selectedId).eq('receiver_id', userId).eq('is_read', false);
      if (error) console.error('markRead error:', error);
    };
    markRead();
  }, [selectedId, supabase, userId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === userId || msg.receiver_id === userId) {
          router.refresh();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === userId || msg.receiver_id === userId) {
          router.refresh();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, router, userId]);

  const handleSelectConversation = (id: string) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setVisibleCount(30);
    setSelectedId(id);
  };

  const handleBackToList = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setSelectedId(null);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedId) {
      setToast({ open: true, message: 'Lütfen mesaj yazın ve bir kişi seçin.', severity: 'error' });
      return;
    }
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: selectedId,
      content: newMessage.trim(),
    });
    setSending(false);
    if (error) {
      setToast({ open: true, message: 'Mesaj gönderilemedi.', severity: 'error' });
    } else {
      setNewMessage('');
      router.refresh();
    }
  };

  const handleConnectLawyer = async () => {
    if (!refCode.trim()) return;
    setConnectLoading(true);
    try {
      const res = await fetch('/api/lawyers/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referansKodu: refCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bağlantı kurulamadı');
      setToast({ open: true, message: 'Avukat bağlantısı kuruldu.', severity: 'success' });
      setOpenDialog(false);
      setRefCode('');
      router.refresh();
    } catch (err: any) {
      setToast({ open: true, message: err.message, severity: 'error' });
    } finally {
      setConnectLoading(false);
    }
  };

  // Message actions
  const openMessageMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.blur();
    setMenuAnchor(event.currentTarget);
  };

  const openMessageMenuById = (msgId: string, anchorEl: HTMLElement) => {
    anchorEl.setAttribute('data-msg-id', msgId);
    setMenuAnchor(anchorEl);
  };

  const closeMessageMenu = () => {
    setMenuAnchor(null);
  };

  const startEdit = (msgId: string, currentText: string) => {
    closeMessageMenu();
    setEditMsgId(msgId);
    setEditText(currentText);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editMsgId || !editText.trim()) return;
    setEditLoading(true);
    const { error } = await supabase.from('messages').update({ content: editText.trim(), edited_at: new Date().toISOString() }).eq('id', editMsgId);
    setEditLoading(false);
    setEditOpen(false);
    setEditMsgId(null);
    if (error) {
      setToast({ open: true, message: 'Mesaj düzenlenemedi.', severity: 'error' });
    } else {
      router.refresh();
    }
  };

  const confirmDelete = (mode: 'me' | 'all') => {
    closeMessageMenu();
    const msgId = menuAnchor?.getAttribute('data-msg-id');
    if (!msgId) return;
    setDeleteMsgId(msgId);
    setDeleteMode(mode);
    setDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteMsgId) return;
    setDeleteLoading(true);
    let error;
    if (deleteMode === 'all') {
      ({ error } = await supabase.from('messages').update({ is_deleted_for_all: true }).eq('id', deleteMsgId));
    } else {
      // Delete for me: determine if I'm sender or receiver
      const msg = messages.find((m) => m.id === deleteMsgId);
      if (msg?.sender_id === userId) {
        ({ error } = await supabase.from('messages').update({ deleted_by_sender: true }).eq('id', deleteMsgId));
      } else {
        ({ error } = await supabase.from('messages').update({ deleted_by_receiver: true }).eq('id', deleteMsgId));
      }
    }
    setDeleteLoading(false);
    setDeleteOpen(false);
    setDeleteMsgId(null);
    if (error) {
      setToast({ open: true, message: 'Mesaj silinemedi.', severity: 'error' });
    } else {
      router.refresh();
    }
  };

  const selectedContact = selectedId ? contactMap.get(selectedId) : null;

  const formatTime = (val: string) => {
    try {
      return new Date(val).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const showList = !isMobile || selectedId === null;
  const showPanel = !isMobile || selectedId !== null;

  return (
    <Box sx={{ height: { xs: 'calc(100dvh - 160px)', md: 'calc(100dvh - 192px)' }, display: 'flex', flexDirection: 'column' }}>
      {role === 'lawyer' && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: { xs: 1, md: 1.5 }, px: { xs: 1, md: 0 } }}>
          <Button variant="contained" size="small" startIcon={<PersonAdd />} onClick={() => setOpenDialog(true)} fullWidth={isMobile}>
            Avukat Ekle
          </Button>
        </Box>
      )}

      <Paper sx={{ flex: 1, borderRadius: { xs: 2, md: 3 }, overflow: 'hidden', display: 'flex', minHeight: 0 }}>
        {conversations.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Chat sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>Henüz bağlantılı kişi yok</Typography>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                {role === 'lawyer' ? 'Avukat ekleyerek mesajlaşmaya başlayabilirsiniz.' : 'Avukatınızla bağlantı kurarak mesajlaşmaya başlayabilirsiniz.'}
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            {/* Conversation List Sidebar */}
            {showList && (
              <Box
                sx={{
                  width: { xs: '100%', md: 300, lg: 340 },
                  minWidth: { xs: '100%', md: 260, lg: 300 },
                  maxWidth: { xs: '100%', md: 340, lg: 380 },
                  borderRight: { md: '1px solid' },
                  borderColor: { md: 'divider' },
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.paper',
                }}
              >
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Mesajlar</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{conversations.length} bağlantı</Typography>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {conversations.map((conv) => (
                    <Box
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        cursor: 'pointer',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: selectedId === conv.id ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Badge badgeContent={conv.unreadCount || undefined} color="error" overlap="circular">
                        <Avatar sx={{ width: 40, height: 40, bgcolor: conv.avatarColor, fontSize: 14, fontWeight: 700 }}>
                          {getInitials(conv.name)}
                        </Avatar>
                      </Badge>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.lastMessage || conv.subtitle}
                        </Typography>
                      </Box>
                      {conv.lastMessageAt && (
                        <Typography variant="caption" sx={{ color: 'text.disabled', flexShrink: 0, fontSize: 11 }}>
                          {formatTime(conv.lastMessageAt)}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Message Panel */}
            {showPanel && (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, bgcolor: 'background.default' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: { xs: 1.5, md: 2 }, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
                  {isMobile && (
                    <IconButton size="small" onClick={handleBackToList} edge="start">
                      <ArrowBack />
                    </IconButton>
                  )}
                  {selectedContact ? (
                    <>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: selectedContact.role === 'lawyer' ? '#1E3A5F' : '#C9A227', fontSize: 13, fontWeight: 700 }}>
                        {getInitials(selectedContact.full_name ?? 'K')}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedContact.full_name ?? 'Kullanıcı'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {selectedContact.role === 'lawyer' ? (selectedContact.specialization ? `Avukat · ${selectedContact.specialization}` : 'Avukat') : 'Müvekkil'}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Bir kişi seçin</Typography>
                  )}
                </Box>

                {/* Messages Area */}
                <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
                  {selectedId ? (
                    activeMessages.length === 0 ? (
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>Henüz mesaj yok. İlk mesajı siz gönderin.</Typography>
                      </Box>
                    ) : (
                      <React.Fragment>
                        {hasMore && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                            <Button size="small" variant="outlined" onClick={() => setVisibleCount((c) => c + 30)}>
                              Daha fazla mesaj yükle
                            </Button>
                          </Box>
                        )}
                        {activeMessages.map((msg) => {
                          const isOwn = msg.sender_id === userId;
                          const isDeletedForAll = msg.is_deleted_for_all;
                          const isEdited = !!msg.edited_at;

                          return (
                            <Box
                              key={msg.id}
                              sx={{
                                alignSelf: isDeletedForAll ? (isOwn ? 'flex-end' : 'flex-start') : (isOwn ? 'flex-end' : 'flex-start'),
                                maxWidth: { xs: '92%', md: '70%' },
                                minWidth: 0,
                                position: 'relative',
                              }}
                            >
                              {isDeletedForAll ? (
                                <Box
                                  sx={{
                                    p: { xs: 1.5, md: 2 },
                                    borderRadius: 2,
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                    bgcolor: 'action.disabledBackground',
                                    color: 'text.secondary',
                                    fontStyle: 'italic',
                                  }}
                                >
                                  <Typography variant="body2">
                                    {isOwn ? 'Bu mesajı sildiniz' : 'Bu mesaj silindi'}
                                  </Typography>
                                </Box>
                              ) : (
                                <Box
                                  sx={{
                                    position: 'relative',
                                    alignSelf: isOwn ? 'flex-end' : 'flex-start',
                                    maxWidth: '100%',
                                    '&:hover .msg-actions': { opacity: 1 },
                                    '&:active .msg-actions': { opacity: 1 },
                                  }}
                                  onContextMenu={(e) => {
                                    if (isOwn) {
                                      e.preventDefault();
                                      openMessageMenuById(msg.id, e.currentTarget);
                                    }
                                  }}
                                >
                                  <Box
                                    sx={{
                                      p: { xs: 1.5, md: 2 },
                                      pr: isOwn ? 5 : undefined,
                                      borderRadius: 2,
                                      borderBottomRightRadius: isOwn ? 0 : 2,
                                      borderBottomLeftRadius: isOwn ? 2 : 0,
                                      bgcolor: isOwn ? 'primary.main' : 'background.paper',
                                      color: isOwn ? 'primary.contrastText' : 'text.primary',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                      transition: 'background-color 0.15s',
                                      '&:hover': {
                                        bgcolor: isOwn ? 'primary.dark' : 'action.hover',
                                      },
                                    }}
                                  >
                                    <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.5 }}>{msg.content}</Typography>
                                  </Box>
                                  {isOwn && (
                                    <IconButton
                                      data-msg-id={msg.id}
                                      onClick={(e) => openMessageMenu(e)}
                                      className="msg-actions"
                                      sx={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        opacity: isMobile ? 0.7 : 0,
                                        transition: 'opacity 0.2s',
                                        color: 'inherit',
                                        p: 0.5,
                                      }}
                                    >
                                      <MoreVert sx={{ fontSize: 20 }} />
                                    </IconButton>
                                  )}
                                </Box>
                              )}
                              <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block', textAlign: isOwn ? 'right' : 'left', fontSize: 11 }}>
                                {formatTime(msg.created_at)}
                                {isEdited && !isDeletedForAll && (
                                  <Box component="span" sx={{ ml: 0.5, fontStyle: 'italic' }}>(düzenlendi)</Box>
                                )}
                              </Typography>
                            </Box>
                          );
                        })}
                      </React.Fragment>
                    )
                  ) : (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>Sohbet başlatmak için soldan bir kişi seçin.</Typography>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Input Area */}
                {selectedId && (
                  <Box sx={{ p: { xs: 1.5, md: 2 }, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                      <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Mesajınızı yazın..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, minHeight: 56 } }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleSend}
                        disabled={sending || !newMessage.trim()}
                        sx={{ minWidth: 52, height: 48, borderRadius: 3, px: 2, flexShrink: 0 }}
                      >
                        <Send sx={{ fontSize: 20 }} />
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Avukat Ekle Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Avukat Ekle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, mt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Mesajlaşmak istediğiniz avukatın referans kodunu girin.
          </Typography>
          <TextField
            label="Referans Kodu"
            fullWidth
            value={refCode}
            onChange={(e) => setRefCode(e.target.value)}
            placeholder="Örn: ABC123"
            onKeyDown={(e) => { if (e.key === 'Enter') handleConnectLawyer(); }}
          />
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button variant="contained" onClick={handleConnectLawyer} disabled={connectLoading || !refCode.trim()}>
            {connectLoading ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Message Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Mesajı Düzenle</DialogTitle>
        <DialogContent sx={{ pt: 1, mt: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={6}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); } }}
          />
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setEditOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={saveEdit} disabled={editLoading || !editText.trim()}>
            {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Mesajı Sil</DialogTitle>
        <DialogContent sx={{ pt: 1, mt: 1 }}>
          <Typography variant="body2">
            {deleteMode === 'all'
              ? 'Bu mesaj herkesten silinecek. Karşı taraf "Bu mesaj silindi" olarak görecek.'
              : 'Bu mesaj sadece sizin ekranınızdan silinecek.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setDeleteOpen(false)}>İptal</Button>
          <Button variant="contained" color="error" onClick={executeDelete} disabled={deleteLoading}>
            {deleteLoading ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMessageMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: 2, boxShadow: 3, minWidth: 200 } } }}
      >
        <MenuItem onClick={() => {
          const msgId = menuAnchor?.getAttribute('data-msg-id');
          const msg = messages.find((m) => m.id === msgId);
          if (msg) startEdit(msg.id, msg.content);
        }} sx={{ minHeight: 48, px: 2, py: 1 }}>
          <Edit sx={{ mr: 1.5, fontSize: 20 }} /> Düzenle
        </MenuItem>
        <MenuItem onClick={() => confirmDelete('me')} sx={{ minHeight: 48, px: 2, py: 1 }}>
          <Delete sx={{ mr: 1.5, fontSize: 20 }} /> Benden sil
        </MenuItem>
        <MenuItem onClick={() => confirmDelete('all')} sx={{ minHeight: 48, px: 2, py: 1 }}>
          <DeleteForever sx={{ mr: 1.5, fontSize: 20 }} /> Herkesten sil
        </MenuItem>
      </Menu>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
