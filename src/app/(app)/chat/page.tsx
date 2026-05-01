'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, TextField, Button, Chip, IconButton, Paper, ToggleButton, ToggleButtonGroup, Fade, useMediaQuery } from '@mui/material';
import { Send, AttachFile, Upload, SmartToy, Person, Science, Visibility, Assessment, PictureAsPdf, TrendingUp, AutoFixHigh } from '@mui/icons-material';

interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; imageUrl?: string; timestamp: Date; }

const aiResponses: Record<string, string> = {
  tedavi: '**Metronidazol %0.75 jel** (günde 2 kez, 4-6 hafta) birinci seçenektir. İkinci seçenek **İvermektin** (200 μg/kg). Destekleyici: çay ağacı yağı şampuanı, göz kapağı hijyeni.',
  akar: '**Demodex folliculorum** (0.3-0.4 mm) göz kapağı köklerinde yaşar. Aşırı çoğalma blefarit, rosacea ve dermatite yol açar.',
  blefarit: 'Demodex akarları göz kapağı yağ bezlerini tıkar, **posterior blefarite** neden olur. Semptomlar: yanma, kaşınma, kızarıklık.',
  rosacea: 'Papülopustüler rosaceada akar yoğunluğu **5-10 kat daha fazladır**. Anti-paraziter tedavi semptomları önemli ölçüde iyileştirir.',
  image: '**Analiz Sonuçları:**\n\n🦠 Akar Sayısı: 5 adet\n📊 Güven Skoru: %89\n⚠️ Yoğunluk: Orta\n📍 Lokalizasyon: Göz kapağı\n\n**Önerilen Tedavi:**\n1️⃣ Metronidazol %0.75 jel (günde 2 kez, 4 hafta)\n2️⃣ Çay ağacı yağı şampuanı (haftada 2 kez)\n3️⃣ Göz kapağı hijyeni (ıslak ısı kompresi)\n4️⃣ 4 hafta sonra kontrol',
  default: 'Görüntünüzü yükleyerek analiz başlatabilir veya Demodex hakkında soru sorabilirsiniz. Size nasıl yardımcı olabilirim?',
};

const suggestedPrompts = [
  { text: 'Demodex akarı nedir?', key: 'akar' },
  { text: 'Tedavi seçenekleri nelerdir?', key: 'tedavi' },
  { text: 'Blefarit ilişkisi nedir?', key: 'blefarit' },
  { text: 'Görüntümü analiz et', key: 'image' },
];

function detectIntent(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('tedavi') || t.includes('ilaç')) return 'tedavi';
  if (t.includes('akar') || t.includes('mite') || t.includes('demodex nedir')) return 'akar';
  if (t.includes('blefarit') || t.includes('göz')) return 'blefarit';
  if (t.includes('rosacea')) return 'rosacea';
  if (t.includes('analiz') || t.includes('incele') || t.includes('görüntü')) return 'image';
  return 'default';
}

export default function ChatPage() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 960px)');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: 'Merhaba! Ben **Demodex AI Asistanı**. Mikroskobik görüntünüzü yükleyerek analiz başlatabilir veya sorularınızı sorabilirsiniz.', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageType, setImageType] = useState<'MICROSCOPIC' | 'DERMOSCOPIC' | 'CLINICAL'>('MICROSCOPIC');
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content, imageUrl: uploadedImage || undefined, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 1200));
    const intent = detectIntent(content);
    const responseText = aiResponses[intent] || aiResponses.default;
    setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: responseText, timestamp: new Date() }]);
    setIsTyping(false);
    if (intent === 'image') setShowAnalysis(true);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <AutoFixHigh sx={{ color: 'primary.main', fontSize: 32 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>AI Sohbet</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Gemma 4 Asistan · Görüntü analizi ve klinik danışmanlık</Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', gap: 2, minHeight: 0, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Chat Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {messages.map((msg) => (
                <Box key={msg.id} sx={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <Box sx={{ display: 'flex', gap: 1.5, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: msg.role === 'assistant' ? 'rgba(93,202,165,0.15)' : 'rgba(133,183,235,0.15)', color: msg.role === 'assistant' ? 'primary.main' : 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {msg.role === 'assistant' ? <SmartToy sx={{ fontSize: 18 }} /> : <Person sx={{ fontSize: 18 }} />}
                    </Box>
                    <Box>
                      <Paper sx={{ p: 1.75, borderRadius: 3, bgcolor: msg.role === 'assistant' ? 'rgba(255,255,255,0.04)' : 'rgba(93,202,165,0.1)', border: 1, borderColor: msg.role === 'assistant' ? 'rgba(255,255,255,0.06)' : 'rgba(93,202,165,0.15)' }}>
                        {msg.imageUrl && <Box sx={{ mb: 1 }}><img src={msg.imageUrl} alt="" style={{ maxWidth: 200, maxHeight: 150, borderRadius: 12 }} /></Box>}
                        <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#5DCAA5">$1</strong>') }} />
                      </Paper>
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: msg.role === 'user' ? 'right' : 'left', color: 'text.secondary' }}>
                        {msg.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
              {isTyping && (
                <Paper sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.04)', border: 1, borderColor: 'divider', alignSelf: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmartToy sx={{ color: 'primary.main', fontSize: 18 }} />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[0, 1, 2].map((i) => (
                        <Box key={i} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', animation: `bounce 0.5s ${i * 0.15}s infinite alternate` }} />
                      ))}
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Analiz ediyor...</Typography>
                  </Box>
                </Paper>
              )}
              {!showAnalysis && messages.length <= 2 && (
                <Box>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>Önerilen sorular:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {suggestedPrompts.map((p) => (
                      <Button key={p.key} variant="outlined" size="small" onClick={() => handleSend(p.text)} sx={{ borderColor: 'rgba(93,202,165,0.2)', color: 'text.secondary', textTransform: 'none', borderRadius: 3, '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
                        {p.text}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.05)' }}>
              {uploadedImage && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, bgcolor: 'rgba(93,202,165,0.06)', borderRadius: 2 }}>
                  <img src={uploadedImage} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                  <Chip label={imageType === 'MICROSCOPIC' ? 'Mikroskopik' : imageType === 'DERMOSCOPIC' ? 'Dermoskopik' : 'Klinik'} size="small" sx={{ bgcolor: 'rgba(93,202,165,0.12)', color: 'primary.main' }} />
                  <IconButton size="small" onClick={() => setUploadedImage(null)} sx={{ color: 'error.main', ml: 'auto' }}>✕</IconButton>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadedImage(URL.createObjectURL(f)); }} />
                <IconButton onClick={() => fileInputRef.current?.click()} sx={{ color: 'text.secondary' }}><AttachFile /></IconButton>
                <TextField fullWidth placeholder="Mesajınızı yazın..." value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} size="small" multiline maxRows={4} />
                <Button variant="contained" onClick={() => handleSend()} disabled={!input.trim() && !uploadedImage} sx={{ bgcolor: 'primary.dark', minWidth: 48, borderRadius: 3 }}><Send sx={{ fontSize: 18 }} /></Button>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Right Panel */}
        {!isMobile && (
          <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
            <Card><CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Görüntü Yükleme</Typography>
              <ToggleButtonGroup value={imageType} exclusive onChange={(_, v) => v && setImageType(v)} size="small" fullWidth sx={{ mb: 1.5 }}>
                <ToggleButton value="MICROSCOPIC" sx={{ textTransform: 'none', fontSize: 12 }}><Science sx={{ fontSize: 14, mr: 0.5 }} />Mikroskopik</ToggleButton>
                <ToggleButton value="DERMOSCOPIC" sx={{ textTransform: 'none', fontSize: 12 }}><Visibility sx={{ fontSize: 14, mr: 0.5 }} />Dermoskopik</ToggleButton>
              </ToggleButtonGroup>
              <Box onClick={() => fileInputRef.current?.click()} sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 3, p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(93,202,165,0.04)' } }}>
                {uploadedImage ? <img src={uploadedImage} alt="" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 12 }} /> : <><Upload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} /><Typography variant="body2" sx={{ color: 'text.secondary' }}>Sürükle veya <strong style={{ color: '#5DCAA5' }}>seç</strong></Typography></>}
              </Box>
            </CardContent></Card>

            {showAnalysis && (
              <Fade in>
                <Card><CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Analiz Sonuçları</Typography>
                  {[{ label: 'Akar Sayısı', value: '5 adet', color: 'error.main' }, { label: 'Güven Skoru', value: '%89', color: 'success.main' }, { label: 'Yoğunluk', value: 'Orta', color: 'warning.main' }, { label: 'Konfidans', value: '3-7 akar', color: 'info.main' }].map((s) => (
                    <Box key={s.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{s.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                    <Button variant="outlined" size="small" fullWidth onClick={() => router.push('/report/a1')} sx={{ textTransform: 'none' }} startIcon={<Assessment />}>Tam Rapor</Button>
                    <Button variant="outlined" size="small" fullWidth sx={{ textTransform: 'none' }} startIcon={<PictureAsPdf />}>PDF İndir</Button>
                  </Box>
                </CardContent></Card>
              </Fade>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
