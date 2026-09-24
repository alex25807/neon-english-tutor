import { useState } from "react";
import { PLACEMENT } from "../game/content";
import { IconArrowRight, IconBolt, IconCheck, IconGear, IconSpeaker, PlayerAvatar, VoltRobot } from "./icons";
import { speak, ttsSupported } from "../game/speech";
import type { GameState, Settings } from "../game/types";
import { Bar, NeonButton } from "./ui";
import SettingsModal from "./SettingsModal";

const AVATARS = [{ name: "Робо-Макс" }, { name: "Лис Тесла" }, { name: "Дракон Вольт" }, { name: "Космо-Дэн" }, { name: "Спайдер" }];

export default function Onboarding({ onComplete, state, onPatch }: { onComplete: (profile: { name: string; avatar: number }, startLevel: number) => void; state: GameState; onPatch: (p: Partial<Settings>) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [nameError, setNameError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const q = PLACEMENT[qIdx];
  const pickAnswer = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const ok = opt === q.answer;
    if (ok) setCorrectCount((c) => c + 1);
    if (ttsSupported) speak(q.answer, { rate: 0.8, gender: state.settings.voiceGender });
    setTimeout(() => { setPicked(null); if (qIdx + 1 < PLACEMENT.length) setQIdx(qIdx + 1); else setStep(2); }, 900);
  };

  const startLevel = correctCount >= 5 ? 3 : correctCount >= 3 ? 2 : 1;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-lg relative">
        {step === 0 && (
          <div className="anim-slide-up bg-deep/90 border-2 border-edge rounded-3xl p-8 shadow-[0_0_60px_rgba(139,92,246,0.3)]">
            <button onClick={() => setSettingsOpen(true)} className="btn-arcade absolute top-4 right-4 w-10 h-10 rounded-xl bg-panel border-2 border-edge text-white/60 hover:text-neon hover:border-neon/60 flex items-center justify-center" aria-label="Настройки"><IconGear className="w-5 h-5" /></button>
            <div className="flex items-center gap-4 mb-2">
              <div className="anim-bobble shrink-0"><VoltRobot mood="cool" className="w-20 h-20" /></div>
              <div><h1 className="font-display text-3xl leading-none"><span className="text-neon neon-cyan">NEON</span> <span className="text-pinky neon-pink">ENGLISH</span></h1><p className="text-white/70 font-bold text-sm mt-1">Квест-репетитор английского языка</p></div>
            </div>
            <p className="text-white/80 font-semibold text-sm leading-relaxed mt-4">Привет! Я <span className="text-neon font-extrabold">Вольт</span> — твой робот-наставник. Мы пролетим шесть планет, победим боссов и выучим английский. Поехали!</p>
            <label className="block mt-6 text-xs font-display uppercase tracking-widest text-white/60">Как тебя зовут, герой?</label>
            <input value={name} onChange={(e) => { setName(e.target.value); setNameError(false); }} maxLength={16} placeholder="Впиши своё имя" className={`mt-2 w-full bg-panel border-2 rounded-xl px-4 py-3 font-extrabold text-white placeholder:text-white/30 outline-none transition-colors ${nameError ? "border-hot anim-shake" : "border-edge focus:border-neon"}`} />
            <label className="block mt-5 text-xs font-display uppercase tracking-widest text-white/60">Выбери аватар</label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {AVATARS.map((a, i) => (<button key={a.name} onClick={() => setAvatar(i)} className={`btn-arcade rounded-xl border-2 p-2 flex flex-col items-center gap-1.5 ${avatar === i ? "border-neon bg-panel2 shadow-[0_0_18px_rgba(0,229,255,0.4)]" : "border-edge bg-panel hover:border-neon/50"}`}><PlayerAvatar idx={i} className="w-10 h-10" /><span className={`text-[9px] font-extrabold ${avatar === i ? "text-neon" : "text-white/60"}`}>{a.name}</span></button>))}
            </div>
            <div className="mt-7"><NeonButton tone="lime" size="lg" className="w-full" onClick={() => { if (!name.trim()) { setNameError(true); return; } setStep(1); }}><IconBolt className="w-5 h-5" /> Вперёд! <IconArrowRight className="w-5 h-5" /></NeonButton></div>
          </div>
        )}
        {step === 1 && (
          <div className="anim-slide-up bg-deep/90 border-2 border-edge rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-4"><VoltRobot mood="happy" className="w-14 h-14" /><div><div className="font-display text-sm text-neon uppercase tracking-widest">Проверка уровня</div><div className="text-white/60 font-bold text-xs">Отвечай как можешь — я подберу старт!</div></div></div>
            <Bar value={(qIdx + 1) / PLACEMENT.length} tone="cyan" h="h-2" />
            <div className="mt-6 text-center"><div className="text-white/50 font-bold text-xs uppercase tracking-widest">Как будет по-английски:</div><div className="font-display text-3xl text-goldy neon-gold mt-3">{q.ru.toUpperCase()}</div></div>
            <div className="grid grid-cols-1 gap-2 mt-5">{q.options.map((opt) => (<button key={opt} onClick={() => pickAnswer(opt)} className={`btn-arcade rounded-xl border-2 px-4 py-3 font-extrabold text-base transition-colors ${picked === opt ? (opt === q.answer ? "border-limey bg-limey/15 text-limey" : "border-hot bg-hot/15 text-hot anim-shake") : "border-edge bg-panel text-white hover:border-neon/70"}`}><span className="inline-flex items-center gap-2"><IconSpeaker className="w-4 h-4 text-neon" />{opt}</span></button>))}</div>
          </div>
        )}
        {step === 2 && (
          <div className="anim-slide-up bg-deep/90 border-2 border-limey/60 rounded-3xl p-8 text-center shadow-[0_0_60px_rgba(163,255,18,0.25)]">
            <VoltRobot mood="wow" className="w-20 h-20 mx-auto anim-bobble" />
            <h2 className="font-display text-2xl text-limey neon-lime uppercase mt-4">Готово!</h2>
            <p className="text-white/80 font-bold text-sm mt-3">Привет, <span className="text-neon">{name}</span>! Твой стартовый уровень — <span className="text-goldy font-extrabold">{startLevel}</span>. Поехали покорять галактику!</p>
            <div className="mt-7"><NeonButton tone="cyan" size="lg" className="w-full" onClick={() => onComplete({ name: name.trim(), avatar }, startLevel)}><IconCheck className="w-5 h-5" /> Начать приключение <IconArrowRight className="w-5 h-5" /></NeonButton></div>
          </div>
        )}
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} state={state} onPatch={onPatch} onReset={() => {}} />
    </div>
  );
}
