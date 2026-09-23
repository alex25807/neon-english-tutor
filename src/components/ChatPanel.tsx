import { useEffect, useRef, useState } from "react";
import { DICT_EN, DICT_RU, GRAMMAR_TIPS, SENTENCES } from "../game/content";
import { speak, startListening, sttSupported, stopSpeaking, ttsSupported } from "../game/speech";
import type { ChatMsg, GameState, Toast } from "../game/types";
import { IconMic, IconSend, IconSpeaker, VoltRobot } from "./icons";
import { NeonButton } from "./ui";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function exampleFor(en: string): { en: string; ru: string } | null {
  const s = SENTENCES.find((x) => x.en.toLowerCase().includes(en.toLowerCase()));
  return s ? { en: s.en, ru: s.ru } : null;
}

export default function ChatPanel({ state, onAppend, onToast }: { state: GameState; onAppend: (msgs: ChatMsg[]) => void; onToast: (t: Omit<Toast, "id">) => void }) {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<{ stop: () => void } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [state.chat]);
  useEffect(() => () => { recRef.current?.stop(); stopSpeaking(); }, []);

  const voltReply = (text: string): ChatMsg => ({ id: uid(), from: "volt", text, at: Date.now() });
  const myMsg = (text: string): ChatMsg => ({ id: uid(), from: "me", text, at: Date.now() });

  const processInput = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const msgs: ChatMsg[] = [myMsg(text)];
    const lower = text.toLowerCase();
    const reply = buildReply(lower);
    msgs.push(voltReply(reply.msgs[0]));
    if (reply.msgs[1]) msgs.push(voltReply(reply.msgs[1]));
    onAppend(msgs);
    if (reply.enWord && ttsSupported && state.settings.voiceOn) speak(reply.enWord, { rate: state.settings.rate, gender: state.settings.voiceGender });
    setInput("");
  };

  const buildReply = (lower: string): { msgs: string[]; enWord?: string } => {
    if (/привет|hello|hi|хай/.test(lower)) return { msgs: ["Hello! Рад тебя видеть! Как дела?", "Попробуй написать: I am fine!"], enWord: "Hello" };
    if (/как дела|how are/.test(lower)) return { msgs: ["I am fine, thanks! А ты?", "«I am fine» — «Я в порядке». Повтори за мной!"], enWord: "I am fine" };
    if (/пока|bye|goodbye/.test(lower)) return { msgs: ["Goodbye! До встречи, герой!", "Возвращайся скорее — у нас ещё много квестов!"], enWord: "Goodbye" };
    if (/спасибо|thank/.test(lower)) return { msgs: ["You are welcome! Пожалуйста!", "«You are welcome» — «Пожалуйста». Запомни!"], enWord: "You are welcome" };
    if (/правило|грамматик/.test(lower)) { const tip = GRAMMAR_TIPS[Math.floor(Math.random() * GRAMMAR_TIPS.length)]; return { msgs: [`${tip.title}: ${tip.text}`] }; }
    if (/пример|sentence/.test(lower)) { const s = SENTENCES[Math.floor(Math.random() * SENTENCES.length)]; return { msgs: [`${s.en} — ${s.ru}`], enWord: s.en }; }
    if (/love|нрав/.test(lower)) return { msgs: [`I like you too! «I like» значит «мне нравится». Попробуй: I like pizza!`], enWord: "I like pizza" };

    const enKeys = Object.keys(DICT_EN).sort((a, b) => b.length - a.length);
    for (const k of enKeys) {
      if (k.length < 2) continue;
      const re = new RegExp(`(^|[^a-z])${k.replace(/ /g, "\\s+")}([^a-z]|$)`, "i");
      if (re.test(lower)) { const w = DICT_EN[k]; const ex = exampleFor(w.en); return { msgs: [`«${w.en}» по-русски будет «${w.ru}».`, ex ? `Пример: ${ex.en} — ${ex.ru}.` : `Повтори за мной: ${w.en}!`], enWord: w.en }; }
    }
    const ruKeys = Object.keys(DICT_RU).sort((a, b) => b.length - a.length);
    for (const k of ruKeys) {
      if (k.length < 3) continue;
      if (lower.includes(k)) { const w = DICT_RU[k]; return { msgs: [`«${w.ru}» по-английски — ${w.en}. Скажи это вслух три раза!`], enWord: w.en }; }
    }
    return { msgs: [`Интересно! Я лучше всего понимаю английские слова из нашего квеста. Напиши, например: cat, apple или «расскажи правило».`] };
  };

  const toggleMic = () => {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = startListening({ lang: "ru-RU", onInterim: setInterim, onFinal: (text) => { setInterim(text); setListening(false); processInput(text); }, onEnd: () => setListening(false), onError: (err) => { setListening(false); if (err !== "aborted" && err !== "no-speech") onToast({ title: "Микрофон не отвечает", tone: "pink" }); } });
    if (!rec) { onToast({ title: "Браузер не умеет слушать", tone: "pink" }); return; }
    recRef.current = rec; setListening(true); setInterim("");
  };

  return (
    <div className="px-4 max-w-3xl mx-auto w-full py-6">
      <div className="bg-deep/90 border-2 border-edge rounded-3xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        <div className="px-5 py-4 border-b-2 border-edge flex items-center gap-3 bg-panel/50">
          <VoltRobot mood="happy" className="w-12 h-12 anim-bobble" />
          <div>
            <div className="font-display text-neon uppercase tracking-wider text-sm">Вольт</div>
            <div className="text-white/50 font-bold text-xs">Твой робот-наставник</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {state.chat.length === 0 && (
            <div className="text-center py-12">
              <VoltRobot mood="cool" className="w-20 h-20 mx-auto anim-bobble" />
              <p className="text-white/60 font-bold text-sm mt-4 max-w-sm mx-auto">Привет! Я Вольт — твой робот-наставник. Спроси меня про слово, правило или просто поболтай!</p>
            </div>
          )}
          {state.chat.map((m) => (
            <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.from === "me" ? "bg-neon text-[#04252b] font-extrabold" : "bg-panel border-2 border-edge text-white"}`}>
                <p className="text-sm leading-snug">{m.text}</p>
                {m.from === "volt" && ttsSupported && state.settings.voiceOn && <button onClick={() => speak(m.text, { lang: "ru-RU", rate: state.settings.rate + 0.1, gender: state.settings.voiceGender })} className="mt-1 text-[10px] font-extrabold text-neon hover:text-white transition-colors inline-flex items-center gap-1"><IconSpeaker className="w-3 h-3" /> Озвучить</button>}
              </div>
            </div>
          ))}
          {listening && interim && <div className="flex justify-start"><div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-panel border-2 border-neon/50 text-neon/70 font-bold text-sm italic">Слышу: {interim}…</div></div>}
          <div ref={endRef} />
        </div>
        <div className="px-4 py-3 border-t-2 border-edge bg-panel/50">
          <div className="flex gap-2">
            <button onClick={toggleMic} className={`btn-arcade w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0 ${listening ? "bg-hot border-[#ff9bae] text-white" : "bg-panel2 border-edge text-white/60 hover:text-neon hover:border-neon/60"}`} aria-label="Говорить"><IconMic className="w-5 h-5" /></button>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && processInput(input)} placeholder="Напиши сообщение…" className="flex-1 bg-panel border-2 border-edge rounded-xl px-4 py-2.5 font-extrabold text-sm text-white placeholder:text-white/30 outline-none focus:border-neon transition-colors" />
            <NeonButton tone="cyan" onClick={() => processInput(input)} disabled={!input.trim()}><IconSend className="w-4 h-4" /></NeonButton>
          </div>
          {!sttSupported && <p className="text-white/30 font-bold text-[10px] mt-2 text-center">Микрофон недоступен в этом браузере</p>}
        </div>
      </div>
    </div>
  );
}
