'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box, Card, CardContent, Typography, TextField, Button, Avatar,
  List, ListItem, ListItemAvatar, ListItemText, Divider, Paper, IconButton,
  Badge,
} from '@mui/material';
import { Send, Person, Chat } from '@mui/icons-material';

interface MesajlarClientProps {
  userId: string;
  role: string;
  contacts: any[];
  allUsers: any[];
  messages: any[];
}

export default function MesajlarClient({ userId, role, contacts, allUsers, messages }: MesajlarClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get('u'));
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contactMap = new Map<string, any>();
  [...contacts, ...allUsers].forEach((u) => contactMap.set(u.id, u));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, selectedUserId]);

  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as any;
          if (msg.sender_id === userId || msg.receiver_id === userId) {
            setLocalMessages((prev) => {
              if (prev.find((p) => p.id === msg.id)) return prev;
              return [msg, ...prev];
            });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  const threadMessages = selectedUserId
    ? localMessages
        .filter((m) => (m.sender_id === userId && m.receiver_id === selectedUserId) || (m.sender_id === selectedUserId && m.receiver_id === userId))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const unreadCount = (contactId: string) =>
    localMessages.filter((m) => m.sender_id === contactId && m.receiver_id === userId && !m.is_read).length;

  const lastMessage = (contactId: string) => {
    const msgs = localMessages.filter((m) => (m.sender_id === userId && m.receiver_id === contactId) || (m.sender_id === contactId && m.receiver_id === userId));
    return msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUserId) return;
    const { data } = await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: selectedUserId,
      content: newMessage.trim(),
    }).select().single();
    if (data) {
      setLocalMessages((prev) => [data, ...prev]);
    }
    setNewMessage('');
  };

  const handleSelect = (id: string) => {
    setSelectedUserId(id);
    supabase.from('messages').update({ is_read: true }).eq('sender_id', id).eq('receiver_id', userId).eq('is_read', false);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', gap: 2 }}>
      {/* Contacts */}
      <Card sx={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Mesajlar</Typography>
          <List sx={{ p: 0 }}>
            {allUsers.map((u) => {
              const unread = unreadCount(u.id);
              const last = lastMessage(u.id);
              return (
                <ListItem
                  key={u.id}
                  onClick={() => handleSelect(u.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    cursor: 'pointer',
                    bgcolor: selectedUserId === u.id ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.dark', fontSize: 14 }}>
                      {(u.full_name?.charAt(0) ?? 'U').toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: unread > 0 ? 700 : 500 }}>{u.full_name}</Typography>
                        {unread > 0 && <Badge badgeContent={unread} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }} />}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {last?.content ?? 'Henüz mesaj yok'}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedUserId ? (
          <>
            <CardContent sx={{ p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'primary.dark', fontSize: 14, width: 36, height: 36 }}>
                  {(contactMap.get(selectedUserId)?.full_name?.charAt(0) ?? 'U').toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{contactMap.get(selectedUserId)?.full_name ?? 'Kullanıcı'}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{contactMap.get(selectedUserId)?.role === 'lawyer' ? 'Avukat' : 'Müvekkil'}</Typography>
                </Box>
              </Box>
            </CardContent>

            <CardContent sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {threadMessages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Chat sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Henüz mesaj yok. İlk mesajı siz gönderin.</Typography>
                </Box>
              ) : (
                threadMessages.map((m) => (
                  <Box key={m.id} sx={{ alignSelf: m.sender_id === userId ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    <Paper sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: m.sender_id === userId ? 'primary.main' : 'action.hover',
                      color: m.sender_id === userId ? '#fff' : 'inherit',
                    }}>
                      <Typography variant="body2">{m.content}</Typography>
                    </Paper>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25, textAlign: m.sender_id === userId ? 'right' : 'left' }}>
                      {new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                ))
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <CardContent sx={{ p: 2, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Mesajınızı yazın..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  size="small"
                  multiline
                  maxRows={3}
                />
                <Button variant="contained" onClick={handleSend} disabled={!newMessage.trim()}>
                  <Send sx={{ fontSize: 18 }} />
                </Button>
              </Box>
            </CardContent>
          </>
        ) : (
          <CardContent sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Chat sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>Sohbet Seçin</Typography>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>Mesajlaşmak istediğiniz kişiyi soldaki listeden seçin.</Typography>
            </Box>
          </CardContent>
        )}
      </Card>
    </Box>
  );
}
