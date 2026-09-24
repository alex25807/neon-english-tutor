import { speak, ttsSupported } from "../game/speech";
import type { GameState, Settings } from "../game/types";
import { IconSpeaker, VoltRobot } from "./icons";
import { Modal, NeonButton } from "./ui";

function Toggle({ on, onClick, label, desc }: { on: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 text-left group">
      <span className={`relative w-12 h-7 rounded-full border-2 transition-colors shrink-0 ${on ? "bg-neon/25 border-neon" : "bg-[#0d0730] border-edge"}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${on ? "left-6 bg-neon shadow-[0_0_8px_rgba(0,229,255,0.9)]" : "left-0.5 bg-white/30"}`} />
      </span>
      <span><span className="block font-extrabold text-sm text-white group-hover:text-neon transition-colors">{label}</span><span className="block text-[11px] font-bold text-white/45">{desc}</span></span>
    </button>
  );
}

export default function SettingsModal({ open, onClose, state, onPatch, onReset }: { open: boolean; onClose: () => void; state: GameState; onPatch: (p: Partial<Settings>) => void; onReset: () => void }) {
  const s = state.settings;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center gap-3"><VoltRobot mood="cool" className="w-12 h-12" /><h3 className="font-display text-lg text-neon neon-cyan uppercase">Настройки</h3></div>
      <div className="space-y-5 mt-6">
        <Toggle on={s.voiceOn} onClick={() => onPatch({ voiceOn: !s.voiceOn })} label="Озвучивать английские слова" desc="Слова, ответы боссов и подсказки звучат голосом" />
        <Toggle on={s.voltTalks} onClick={() => onPatch({ voltTalks: !s.voltTalks })} label="Вольт говорит вслух" desc="Реплики наставника озвучиваются по-русски" />
        <div>
          <span className="block font-extrabold text-sm text-white mb-2">Голос для английского</span>
          <div className="grid grid-cols-3 gap-2">
            {(["default", "male", "female"] as const).map((g) => (<button key={g} onClick={() => onPatch({ voiceGender: g })} className={`btn-arcade px-3 py-2 rounded-xl border-2 font-extrabold text-xs transition-colors ${s.voiceGender === g ? "bg-neon text-[#04252b] border-[#8ffbff] shadow-[0_0_14px_rgba(0,229,255,0.5)]" : "bg-panel text-white/70 border-edge hover:border-neon/50 hover:text-white"}`}>{g === "default" ? "По умолчанию" : g === "male" ? "Мужской" : "Женский"}</button>))}
          </div>
          <p className="text-[10px] font-bold text-white/40 mt-1.5">Выбор голоса зависит от доступных в вашем браузере</p>
        </div>
        <div>
          <div className="flex items-center justify-between"><span className="font-extrabold text-sm text-white">Скорость речи</span><span className="font-display text-xs text-neon">{s.rate.toFixed(2)}x</span></div>
          <input type="range" min={0.6} max={1.2} step={0.05} value={s.rate} onChange={(e) => onPatch({ rate: Number(e.target.value) })} className="w-full mt-2 accent-[#00e5ff]" />
          <div className="flex justify-between text-[10px] font-extrabold text-white/35 uppercase tracking-wide"><span>медленно</span><span>быстро</span></div>
          <button onClick={() => speak("Hello! I am Volt. Let's learn English!", { rate: s.rate, gender: s.voiceGender })} disabled={!ttsSupported} className="btn-arcade mt-2 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-panel2 border-2 border-edge text-neon text-xs font-extrabold hover:border-neon/60 disabled:opacity-30"><IconSpeaker className="w-4 h-4" /> Проверить голос</button>
        </div>
        <div className="rounded-xl border-2 border-edge bg-panel px-4 py-3 text-[11px] font-bold text-white/55 leading-relaxed">Весь прогресс сохраняется автоматически в этом браузере.</div>
        <div className="border-t-2 border-edge pt-4"><NeonButton tone="dark" className="w-full" onClick={onReset}>Сбросить весь прогресс</NeonButton></div>
      </div>
    </Modal>
  );
}
