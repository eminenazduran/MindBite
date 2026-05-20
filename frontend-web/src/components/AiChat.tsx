import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../api';
import { useAuth } from '../context/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

const SUGGESTIONS = [
  'Bugün ne yemeliyim?',
  'Proteini nasıl artırabilirim?',
  'Hangi atıştırmalıklar sağlıklı?',
  'Kilo vermek için ipuçları ver',
];

export default function AiChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Chat açıldığında otomatik karşılama mesajı
  useEffect(() => {
    if (!user || !open || hasGreeted) return;
    setHasGreeted(true);
    setMessages([{
      role: 'assistant',
      content: `Merhaba ${user.name?.split(' ')[0] || ''}! 👋 Ben MindBite beslenme asistanınım. Beslenme, kalori, alerjen veya sağlıklı yaşam hakkında her şeyi sorabilirsin.`,
      ts: Date.now()
    }]);
  }, [open, user]);

  // Yeni mesaj gelince en alta kaydır
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Chat açılınca input'a odaklan
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // Oturum yoksa hiçbir şey render etme (hook'lardan SONRA olmalı)
  if (!user) return null;

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMessage: Message = { role: 'user', content: msg, ts: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Gemini'ye gönderilecek geçmiş (son 10 mesaj, karşılama hariç)
      const historyForApi = newMessages.slice(1).slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await sendChatMessage(msg, historyForApi.slice(0, -1));

      const reply = res.status === 'success'
        ? res.data.reply
        : `Şu an yanıt veremiyorum, birazdan tekrar dene. 🙏 (Hata: ${res.debug || res.message})`;

      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Bir bağlantı sorunu oluştu. İnternet bağlantını kontrol et. 🔌 (${err.message})`,
        ts: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Buton */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed right-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] md:right-6 md:bottom-6 z-50 w-14 h-14 rounded-full hero-gradient text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-200"
        aria-label="AI Asistan"
      >
        {open
          ? <span className="material-symbols-outlined text-2xl">close</span>
          : <span className="material-symbols-outlined text-2xl">smart_toy</span>
        }
        {/* Pulse efekti — kapalıyken */}
        {!open && (
          <span className="absolute inset-0 rounded-full hero-gradient animate-ping opacity-20 pointer-events-none" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed left-3 right-3 bottom-[calc(10rem+env(safe-area-inset-bottom))] md:left-auto md:right-6 md:bottom-24 z-50 w-auto md:w-full md:max-w-sm flex flex-col bg-surface rounded-3xl shadow-2xl border border-outline-variant/20 overflow-hidden transition-all duration-300 origin-bottom-right ${
          open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'
        }`}
        style={{ maxHeight: '75vh' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-outline-variant/20 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl hero-gradient flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-lg">smart_toy</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-bold text-on-surface text-sm">MindBite Asistan</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] text-on-surface-variant">Aktif — Gemini 2.5 Flash</span>
            </div>
          </div>
          <button
            onClick={() => {
              setMessages([]);
              setHasGreeted(false);
            }}
            title="Sohbeti temizle"
            className="w-7 h-7 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center transition"
          >
            <span className="material-symbols-outlined text-sm text-on-surface-variant">refresh</span>
          </button>
        </div>

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full hero-gradient flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-white text-xs">smart_toy</span>
                </div>
              )}
              <div
                className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-surface-container-low text-on-surface rounded-tl-sm border border-outline-variant/15'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 items-center">
              <div className="w-7 h-7 rounded-full hero-gradient flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-xs">smart_toy</span>
              </div>
              <div className="bg-surface-container-low border border-outline-variant/15 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Hızlı Öneriler (sadece başlangıçta) */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 transition font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-outline-variant/15 flex items-center gap-2 bg-surface flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Bir şey sor..."
            disabled={loading}
            className="flex-1 bg-surface-container-low rounded-xl px-4 py-2.5 text-sm outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/60 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl hero-gradient text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition flex-shrink-0 shadow-md"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </div>
      </div>
    </>
  );
}
