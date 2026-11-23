import { useEffect, useRef, useState } from "react";
import { pickBestHeard, speak, startListening, sttSupported, stopSpeaking, ttsSupported } from "../game/speech";
import { firstSpeakPrompt, nextSpeakPrompt, voiceFeedback, type SpeakPrompt } from "../game/voiceTutor";
import type { ChatMsg, GameState, Toast } from "../game/types";
import { IconArrowRight, IconMic, IconRefresh, IconSpeaker, VoltRobot } from "./icons";
import { NeonButton, StarRow } from "./ui";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function VoicePractice({ state, onAppend, onToast, onSpeakSuccess }: {
  state: GameState;
  onAppend: (msgs: ChatMsg[]) => void;
  onToast: (t: Omit<Toast, "id">) => void;
  onSpeakSuccess: (stars: 2 | 3) => void;
}) {
  const [prompt, setPrompt] = useState<SpeakPrompt>(() => firstSpeakPrompt(state));
  const [usedIds, setUsedIds] = useState<string[]>([firstSpeakPrompt(state).id]);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<{ stars: 0 | 1 | 2 | 3; ok: boolean; text: string; mood: "happy" | "wow" | "sad" | "cool" } | null>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const judged = useRef(false);
  const promptRef = useRef(prompt);
  promptRef.current = prompt;

  useEffect(() => () => { recRef.current?.stop(); stopSpeaking(); }, []);
  useEffect(() => { void playPrompt(prompt); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- play the first phrase once

  const playPrompt = async (p = prompt) => {
    if (!ttsSupported) return;
    stopSpeaking();
    if (state.settings.voltTalks) await speak("Повтори за мной!", { lang: "ru-RU", rate: state.settings.rate + 0.1, gender: state.settings.voiceGender });
    if (state.settings.voiceOn) speak(p.en, { rate: state.settings.rate, gender: state.settings.voiceGender });
  };

  const goNext = () => {
    recRef.current?.stop();
    const next = nextSpeakPrompt(state, usedIds);
    setUsedIds((ids) => ids.includes(next.id) ? ids : [...ids, next.id]);
    setPrompt(next);
    setHeard("");
    setTyped("");
    setInterim("");
    setResult(null);
    judged.current = false;
    void playPrompt(next);
  };

  const judge = (raw: string) => {
    const text = raw.trim();
    if (!text || judged.current) return;
    judged.current = true;
    recRef.current?.stop();
    setListening(false);
    const target = promptRef.current.en;
    const best = pickBestHeard(target, text, [text]);
    const fb = voiceFeedback(target, best);
    setHeard(best);
    setResult(fb);
    onAppend([
      { id: uid(), from: "me", text: best, at: Date.now() },
      { id: uid(), from: "volt", text: `${fb.text} (${target} — ${promptRef.current.ru})`, at: Date.now() },
    ]);
    if (fb.ok && (fb.stars === 2 || fb.stars === 3)) onSpeakSuccess(fb.stars);
    if (fb.ok && ttsSupported && state.settings.voiceOn) speak(target, { rate: state.settings.rate, gender: state.settings.voiceGender });
    else if (!fb.ok && ttsSupported && state.settings.voltTalks) speak(fb.text, { lang: "ru-RU", rate: state.settings.rate + 0.1, gender: state.settings.voiceGender });
  };

  const toggleMic = () => {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    if (!sttSupported) { onToast({ title: "Браузер не умеет слушать", desc: "Напиши фразу вручную", tone: "pink" }); return; }
    stopSpeaking();
    judged.current = false;
    setResult(null);
    setHeard("");
    const rec = startListening({
      lang: "en-US",
      onInterim: setInterim,
      onFinal: (text, alts) => {
        setInterim("");
        setListening(false);
        const best = pickBestHeard(promptRef.current.en, text, alts ?? []);
        judge(best);
      },
      onEnd: () => setListening(false),
      onError: (err) => {
        setListening(false);
        if (err === "not-allowed" || err === "service-not-allowed") onToast({ title: "Нет доступа к микрофону", desc: "Разреши микрофон или напиши фразу", tone: "pink" });
        else if (err !== "aborted" && err !== "no-speech") onToast({ title: "Микрофон не отвечает", desc: "Напиши фразу вручную", tone: "pink" });
      },
    });
    if (!rec) { onToast({ title: "Браузер не умеет слушать", desc: "Напиши фразу вручную", tone: "pink" }); return; }
    recRef.current = rec;
    setListening(true);
    setInterim("");
  };

  const retry = () => {
    judged.current = false;
    setResult(null);
    setHeard("");
    setTyped("");
    void playPrompt();
  };

  return (
    <div className="bg-deep/90 border-2 border-edge rounded-3xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 268px)", minHeight: "520px" }}>
      <div className="px-5 py-4 border-b-2 border-edge flex items-center gap-3 bg-panel/50">
        <VoltRobot mood={result?.mood ?? "cool"} className="w-12 h-12 anim-bobble" />
        <div>
          <div className="font-display text-neon uppercase tracking-wider text-sm">Говори с Вольтом</div>
          <div className="text-white/50 font-bold text-xs">Повторяй английские фразы в микрофон</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="text-center max-w-md mx-auto">
          <span className="font-display text-[10px] uppercase tracking-[0.3em] text-neon">{prompt.hint}</span>
          <div className="font-display text-4xl md:text-5xl text-white mt-3" style={{ textShadow: "0 0 24px rgba(0,229,255,0.45)" }}>{prompt.en}</div>
          <div className="text-white/65 font-extrabold text-lg mt-2">{prompt.ru}</div>
          <button onClick={() => playPrompt()} className="btn-arcade mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-panel2 border-2 border-neon/60 text-neon font-extrabold text-sm">
            <IconSpeaker className="w-4 h-4" /> Послушать
          </button>
          <div className="flex justify-center mt-8">
            <button
              onClick={toggleMic}
              aria-label="Говорить в микрофон"
              className={`btn-arcade relative w-28 h-28 rounded-full border-4 flex items-center justify-center ${listening ? "bg-hot border-[#ff9bae] text-white shadow-[0_0_40px_rgba(255,84,112,0.8)] anim-pulse-glow" : "bg-gradient-to-br from-[#ff2ec4] to-[#8b5cf6] border-[#ff9be4] text-white shadow-[0_0_30px_rgba(255,46,196,0.6)]"}`}
            >
              <IconMic className="w-12 h-12" />
              {listening && <span className="absolute inset-0 rounded-full border-4 border-hot animate-ping opacity-40" />}
            </button>
          </div>
          <div className="mt-4 min-h-8 font-extrabold text-sm">
            {listening ? <span className="text-neon">{interim ? `Слышу: «${interim}»` : "Слушаю... говори по-английски!"}</span> : !sttSupported ? <span className="text-white/40 text-xs">Микрофон недоступен — напиши фразу ниже</span> : <span className="text-white/45">Нажми микрофон и повтори фразу</span>}
          </div>
          {result && (
            <div className={`mt-5 rounded-2xl border-2 px-4 py-4 ${result.ok ? "border-limey/70 bg-limey/10" : "border-hot/70 bg-hot/10"}`}>
              <StarRow n={result.stars} size="w-8 h-8" animate />
              <p className="text-white font-bold text-sm mt-3 leading-snug">{result.text}</p>
              {heard && <p className="text-white/45 font-bold text-xs mt-2">Распознано: «{heard}»</p>}
              <div className="flex gap-2 mt-4">
                <NeonButton tone="gold" className="flex-1" onClick={retry}><IconRefresh className="w-4 h-4" /> Ещё раз</NeonButton>
                {result.ok && <NeonButton tone="lime" className="flex-1" onClick={goNext}>Дальше <IconArrowRight className="w-4 h-4" /></NeonButton>}
              </div>
            </div>
          )}
          <div className="flex gap-2 max-w-sm mx-auto mt-6">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && typed.trim() && judge(typed)}
              placeholder="…или напиши фразу"
              className="flex-1 bg-panel border-2 border-edge rounded-xl px-4 py-2.5 font-extrabold text-sm text-white placeholder:text-white/30 outline-none focus:border-neon transition-colors"
            />
            <NeonButton tone="cyan" onClick={() => typed.trim() && judge(typed)} disabled={!typed.trim()}>ОК</NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
}
