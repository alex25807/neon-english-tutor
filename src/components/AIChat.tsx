import { useEffect, useRef, useState } from "react";
import { speak, stopSpeaking, ttsSupported } from "../game/speech";
import type { Settings } from "../game/types";
import { IconBolt, IconSend, IconSpeaker, VoltRobot } from "./icons";
import { NeonButton } from "./ui";

const API_KEY_STORAGE = "neon-english-openai-key";

interface Message { role: "user" | "assistant"; content: string; }

export default function AIChat({ settings, playerName }: { settings: Settings; playerName: string }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) ?? "");
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => () => stopSpeaking(), []);

  const saveKey = (key: string) => { localStorage.setItem(API_KEY_STORAGE, key); setApiKey(key); setShowKeyInput(false); };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: `Ты Вольт — дружелюбный робот-репетитор английского языка для ребёнка ${playerName} (9-11 лет). Отвечай коротко, весело, используй эмодзи. Помогай учить английский: объясняй слова, правила, давай примеры. Говори по-русски, но вставляй английские слова и фразы. Будь терпеливым и поддерживающим.` },
            ...newMessages.slice(-10),
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });
      if (!response.ok) throw new Error("Ошибка API. Проверьте ключ.");
      const data = await response.json();
      const assistantMsg: Message = { role: "assistant", content: data.choices[0].message.content };
      setMessages([...newMessages, assistantMsg]);
      if (ttsSupported && settings.voiceOn) speak(assistantMsg.content, { lang: "ru-RU", rate: settings.rate + 0.1, gender: settings.voiceGender });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (showKeyInput) {
    return (
      <div className="px-4 max-w-2xl mx-auto w-full py-6">
        <div className="bg-deep/90 border-2 border-edge rounded-3xl p-8 text-center">
          <VoltRobot mood="cool" className="w-20 h-20 mx-auto anim-bobble" />
          <h2 className="font-display text-2xl text-neon neon-cyan uppercase mt-4">ИИ-Вольт</h2>
          <p className="text-white/70 font-bold text-sm mt-3 leading-relaxed">Для работы нужен API-ключ OpenAI. Получите его на <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-pinky hover:text-neon underline">platform.openai.com</a>. Стоимость ~$0.01 за 10 сообщений.</p>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Вставьте API-ключ (sk-...)" className="mt-6 w-full bg-panel border-2 border-edge rounded-xl px-4 py-3 font-mono text-sm text-white placeholder:text-white/30 outline-none focus:border-neon transition-colors" />
          <div className="mt-5 flex gap-3">
            <NeonButton tone="dark" className="flex-1" onClick={() => setShowKeyInput(false)}>Отмена</NeonButton>
            <NeonButton tone="lime" className="flex-1" onClick={() => saveKey(apiKey)} disabled={!apiKey.trim()}>Сохранить</NeonButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 max-w-3xl mx-auto w-full py-6">
      <div className="bg-deep/90 border-2 border-edge rounded-3xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        <div className="px-5 py-4 border-b-2 border-edge flex items-center gap-3 bg-panel/50">
          <VoltRobot mood="wow" className="w-12 h-12 anim-bobble" />
          <div className="flex-1">
            <div className="font-display text-neon uppercase tracking-wider text-sm flex items-center gap-2">ИИ-Вольт <IconBolt className="w-4 h-4 text-goldy" /></div>
            <div className="text-white/50 font-bold text-xs">Умный помощник на базе GPT</div>
          </div>
          <button onClick={() => setShowKeyInput(true)} className="btn-arcade text-[10px] font-extrabold text-white/40 hover:text-neon transition-colors uppercase tracking-wider">Сменить ключ</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <VoltRobot mood="happy" className="w-20 h-20 mx-auto anim-bobble" />
              <p className="text-white/60 font-bold text-sm mt-4 max-w-sm mx-auto">Привет! Я ИИ-Вольт — твой умный помощник. Спроси меня что угодно про английский!</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.role === "user" ? "bg-neon text-[#04252b] font-extrabold" : "bg-panel border-2 border-edge text-white"}`}>
                <p className="text-sm leading-snug whitespace-pre-wrap">{m.content}</p>
                {m.role === "assistant" && ttsSupported && settings.voiceOn && <button onClick={() => speak(m.content, { lang: "ru-RU", rate: settings.rate + 0.1, gender: settings.voiceGender })} className="mt-1 text-[10px] font-extrabold text-neon hover:text-white transition-colors inline-flex items-center gap-1"><IconSpeaker className="w-3 h-3" /> Озвучить</button>}
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-panel border-2 border-neon/50 text-neon/70 font-bold text-sm italic">Вольт думает…</div></div>}
          {error && <div className="text-hot font-bold text-sm text-center">{error}</div>}
          <div ref={endRef} />
        </div>
        <div className="px-4 py-3 border-t-2 border-edge bg-panel/50">
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Спроси что-нибудь…" className="flex-1 bg-panel border-2 border-edge rounded-xl px-4 py-2.5 font-extrabold text-sm text-white placeholder:text-white/30 outline-none focus:border-neon transition-colors" disabled={loading} />
            <NeonButton tone="cyan" onClick={sendMessage} disabled={!input.trim() || loading}><IconSend className="w-4 h-4" /></NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
}
