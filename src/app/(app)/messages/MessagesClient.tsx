'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ChatBox } from '@mui/x-chat';
import type { ChatAdapter, ChatMessage, ChatConversation, ChatUser } from '@mui/x-chat-headless';
import {
  Box, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Snackbar, Alert,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';

interface MessagesClientProps {
  userId: string;
  userName: string;
  role: string;
  contacts: any[];
  allUsers: any[];
  messages: any[];
}

function getInitialsAvatar(name: string, bg: string, fg: string): string {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="${bg}" rx="32"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="${fg}" font-size="28" font-family="sans-serif" font-weight="bold">${initials}</text></svg>`;
  if (typeof window !== 'undefined') {
    return `data:image/svg+xml;base64,${window.btoa(svg)}`;
  }
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function toChatMessages(msgs: any[], userId: string): ChatMessage[] {
  return msgs.map((m) => {
    const senderName = m.sender?.full_name ?? 'Kullanıcı';
    return {
      id: m.id,
      role: m.sender_id === userId ? ('user' as const) : ('assistant' as const),
      parts: [{ type: 'text' as const, text: m.content }],
      createdAt: m.created_at,
      author: {
        id: m.sender_id,
        displayName: senderName,
        role: m.sender_id === userId ? ('user' as const) : ('assistant' as const),
        avatarUrl: getInitialsAvatar(
          senderName,
          m.sender_id === userId ? '#3B82F6' : '#10B981',
          '#ffffff'
        ),
      },
    };
  });
}

export default function MessagesClient({ userId, userName, role, contacts, allUsers, messages }: MessagesClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const initialUserId = searchParams.get('u');
  const [initialConversationId] = useState<string | undefined>(initialUserId ?? undefined);
  const localMessages = useMemo(() => toChatMessages(messages, userId), [messages, userId]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const contactMap = useMemo(() => {
    const map = new Map<string, any>();
    allUsers.forEach((u) => map.set(u.id, u));
    return map;
  }, [allUsers]);

  // Build conversations from allUsers with unread counts
  useEffect(() => {
    const unreadCount = (contactId: string) =>
      messages.filter((m) => m.sender_id === contactId && m.receiver_id === userId && !m.is_read).length;

    const lastMessageAt = (contactId: string) => {
      const msgs = messages.filter((m) => (m.sender_id === userId && m.receiver_id === contactId) || (m.sender_id === contactId && m.receiver_id === userId));
      const last = msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      return last?.created_at;
    };

    const convs: ChatConversation[] = allUsers.map((u) => {
      const contactName = u.full_name ?? 'Kullanıcı';
      const subtitle = u.role === 'lawyer'
        ? (u.specialization ? `Avukat · ${u.specialization}` : 'Avukat')
        : 'Müvekkil';
      return {
        id: u.id,
        title: contactName,
        subtitle,
        unreadCount: unreadCount(u.id),
        lastMessageAt: lastMessageAt(u.id),
        participants: [
          {
            id: userId,
            displayName: userName,
            role: 'user' as const,
            avatarUrl: getInitialsAvatar(userName, '#3B82F6', '#ffffff'),
          },
          {
            id: u.id,
            displayName: contactName,
            role: 'assistant' as const,
            avatarUrl: getInitialsAvatar(contactName, '#10B981', '#ffffff'),
          },
        ],
      };
    });
    setConversations(convs);
  }, [allUsers, messages, userId, userName]);

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

  const currentUser: ChatUser = useMemo(
    () => ({
      id: userId,
      displayName: userName,
      role: 'user',
      avatarUrl: getInitialsAvatar(userName, '#3B82F6', '#ffffff'),
    }),
    [userId, userName]
  );

  const adapter: ChatAdapter = useMemo(() => {
    return {
      listConversations: async () => ({
        conversations,
        hasMore: false,
      }),
      listMessages: async ({ conversationId }) => ({
        messages: localMessages.filter((m) => {
          const raw = messages.find((rawM) => rawM.id === m.id);
          if (!raw) return false;
          return (raw.sender_id === userId && raw.receiver_id === conversationId) || (raw.sender_id === conversationId && raw.receiver_id === userId);
        }).sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()),
        hasMore: false,
      }),
      sendMessage: async ({ message, conversationId }) => {
        await supabase.from('messages').insert({
          sender_id: userId,
          receiver_id: conversationId,
          content: message.parts.map((p: any) => (p.type === 'text' ? p.text : '')).join(''),
        });
        return new ReadableStream({ start(c) { c.close(); } });
      },
      subscribe: async ({ onEvent }) => {
        const channel = supabase
          .channel('messages-sub')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
            const msg = payload.new as any;
            if (msg.sender_id === userId || msg.receiver_id === userId) {
              const senderName = msg.sender_id === userId ? userName : contactMap.get(msg.sender_id)?.full_name ?? 'Kullanıcı';
              onEvent({
                type: 'message-added',
                message: {
                  id: msg.id,
                  role: msg.sender_id === userId ? 'user' : 'assistant',
                  parts: [{ type: 'text', text: msg.content }],
                  createdAt: msg.created_at,
                  author: {
                    id: msg.sender_id,
                    displayName: senderName,
                    role: msg.sender_id === userId ? 'user' : 'assistant',
                    avatarUrl: getInitialsAvatar(
                      senderName,
                      msg.sender_id === userId ? '#3B82F6' : '#10B981',
                      '#ffffff'
                    ),
                  },
                },
              } as any);
            }
          })
          .subscribe();
        return () => { supabase.removeChannel(channel); };
      },
    };
  }, [conversations, localMessages, messages, userId, userName, supabase, contactMap]);

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      {role === 'lawyer' && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<PersonAdd />}
            onClick={() => setOpenDialog(true)}
          >
            Avukat Ekle
          </Button>
        </Box>
      )}
      <Paper sx={{ flex: 1, borderRadius: 3, overflow: 'hidden' }}>
        <ChatBox
          adapter={adapter}
          conversations={conversations}
          currentUser={currentUser}
          initialActiveConversationId={initialConversationId}
          onActiveConversationChange={async (conversationId) => {
            if (!conversationId) return;
            const { error } = await supabase.from('messages').update({ is_read: true }).eq('sender_id', conversationId).eq('receiver_id', userId).eq('is_read', false);
            if (error) console.error('markRead error:', error);
            setConversations((prev) =>
              prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
            );
            router.refresh();
          }}
          features={{
            scrollToBottom: true,
            conversationHeader: true,
            attachments: false,
            helperText: false,
            suggestions: false,
          }}
          slotProps={{
            messageGroup: {
              slots: {
                authorName: () => null,
              },
            },
          }}
          sx={{ height: '100%' }}
        />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Avukat Ekle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
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
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleConnectLawyer}
            disabled={connectLoading || !refCode.trim()}
          >
            {connectLoading ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
