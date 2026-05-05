'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useChat, UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Box, TextField, IconButton, Typography, Paper, CircularProgress, Avatar } from '@mui/material';
import { Send, SmartToy, Person } from '@mui/icons-material';

export default function ChatInterface({ caseId }: { caseId: string }) {
  const [input, setInput] = useState('');
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { case_id: caseId },
    })
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    sendMessage({ text: input });
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height: 500, overflow: 'hidden', borderRadius: 2 }}>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToy fontSize="small" /> Yapay Zeka Dava Asistanı
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Yüklenen belgelere (PDF/DOCX) göre sorularınızı cevaplar.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'background.default' }}>
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 10, color: 'text.secondary' }}>
            <SmartToy sx={{ fontSize: 48, opacity: 0.5, mb: 1 }} />
            <Typography variant="body1">Asistana davayla ilgili soru sorabilirsiniz.</Typography>
            <Typography variant="body2">Örn: "Sözleşmenin tarafları kimlerdir?"</Typography>
          </Box>
        ) : (
          messages.map((m: UIMessage) => (
            <Box
              key={m.id}
              sx={{
                display: 'flex',
                gap: 1.5,
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              {m.role !== 'user' && (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  <SmartToy fontSize="small" />
                </Avatar>
              )}
              
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: m.role === 'user' ? 'primary.main' : 'background.paper',
                  color: m.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  boxShadow: m.role === 'user' ? 0 : 1,
                  borderTopRightRadius: m.role === 'user' ? 0 : 8,
                  borderTopLeftRadius: m.role === 'user' ? 8 : 0,
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {m.parts ? m.parts.map(p => p.type === 'text' ? p.text : '').join('') : (m as any).content}
                </Typography>
              </Box>

              {m.role === 'user' && (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <Person fontSize="small" />
                </Avatar>
              )}
            </Box>
          ))
        )}
        {isLoading && (
          <Box sx={{ display: 'flex', gap: 1.5, alignSelf: 'flex-start', maxWidth: '85%' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <SmartToy fontSize="small" />
            </Avatar>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1, borderTopLeftRadius: 0 }}>
              <CircularProgress size={16} />
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Sözleşmedeki fesih şartları nelerdir?..."
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
          slotProps={{
            input: {
              endAdornment: (
                <IconButton type="submit" disabled={isLoading || !input.trim()} color="primary">
                  <Send />
                </IconButton>
              ),
              sx: { borderRadius: 4, bgcolor: 'action.hover' }
            }
          }}
          size="small"
        />
      </Box>
    </Paper>
  );
}
