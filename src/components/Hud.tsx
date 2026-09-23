import type { GameState } from "../game/types";
import { levelInfo } from "../game/engine";
import { IconBolt, IconChat, IconFlame, IconGear, IconMap, IconSparkle, IconTrophy, IconX, PlayerAvatar } from "./icons";

export type Tab = "map" | "chat" | "ai" | "progress";

export default function Hud({
  state,
  tab,
  onTab,
  onSettings,
  onExit,
  dueCount,
}: {
  state: GameState;
  tab: Tab;
  onTab: (t: Tab) => void;
  onSettings: () => void;
  onExit: () => void;
  dueCount: number;
}) {
  const li = levelInfo(state.xp);
  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "map", label: "Карта", icon: <IconMap className="w-4 h-4" />, badge: dueCount },
    { id: "chat", label: "Чат с Вольтом", icon: <IconChat className="w-4 h-4" /> },
    { id: "ai", label: "ИИ-Вольт", icon: <IconSparkle className="w-4 h-4" /> },
    { id: "progress", label: "Успехи", icon: <IconTrophy className="w-4 h-4" /> },
  ];

  return (
    <header className="relative z-20 px-4 pt-4 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 -skew-x-6 bg-panel border-2 border-edge rounded-xl px-3.5 py-2 shadow-[0_0_18px_rgba(0,229,255,0.15)]">
          <IconBolt className="w-5 h-5 text-goldy drop-shadow-[0_0_6px_rgba(255,214,10,0.9)]" />
          <span className="font-display text-sm tracking-wider skew-x-6">
            <span className="text-neon">NEON</span> <span className="text-pinky">ENGLISH</span>
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 bg-panel border-2 border-edge rounded-xl px-3 py-2" title="Серия дней обучения">
          <IconFlame className={`w-4.5 h-4.5 ${state.streak.count > 0 ? "text-hot drop-shadow-[0_0_6px_rgba(255,84,112,0.9)]" : "text-white/25"}`} />
          <span className="font-display text-sm text-white">{state.streak.count}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-panel border-2 border-edge rounded-xl px-3 py-2" title="Вольты — твои очки энергии">
          <IconBolt className="w-4.5 h-4.5 text-goldy drop-shadow-[0_0_6px_rgba(255,214,10,0.9)]" />
          <span className="font-display text-sm text-goldy">{state.coins}</span>
        </div>

        <div className="flex items-center gap-2.5 bg-panel border-2 border-neon/50 rounded-xl px-3 py-1.5 glow-ring" title={`Опыт: ${li.into}/${li.need}`}>
          <div className="w-9 h-9 rounded-lg bg-deep border-2 border-neon flex items-center justify-center font-display text-neon text-sm shadow-[0_0_10px_rgba(0,229,255,0.5)]">
            {li.level}
          </div>
          <div className="w-24">
            <div className="text-[9px] font-display uppercase tracking-widest text-white/50 leading-none">Уровень</div>
            <div className="h-2 mt-1 rounded-full bg-[#0d0730] border border-edge overflow-hidden">
              <div className="h-full bg-neon shadow-[0_0_8px_rgba(0,229,255,0.9)] transition-all duration-700" style={{ width: `${(li.into / li.need) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-panel border-2 border-edge rounded-xl px-2.5 py-1.5">
          <PlayerAvatar idx={state.profile?.avatar ?? 0} className="w-8 h-8" />
          <span className="font-extrabold text-sm text-white max-w-24 truncate">{state.profile?.name}</span>
        </div>

        <button onClick={onSettings} className="btn-arcade w-10 h-10 rounded-xl bg-panel border-2 border-edge text-white/60 hover:text-neon hover:border-neon/60 flex items-center justify-center" aria-label="Настройки" title="Настройки">
          <IconGear className="w-5 h-5" />
        </button>

        <button onClick={onExit} className="btn-arcade w-10 h-10 rounded-xl bg-panel border-2 border-edge text-white/60 hover:text-hot hover:border-hot/60 flex items-center justify-center" aria-label="Выйти" title="Выйти">
          <IconX className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex gap-2 mt-4">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onTab(t.id)} className={`btn-arcade relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-2 border-b-0 font-display text-xs uppercase tracking-wider transition-colors ${tab === t.id ? "bg-deep border-edge text-neon shadow-[0_-4px_18px_rgba(0,229,255,0.2)]" : "bg-panel/50 border-transparent text-white/50 hover:text-white/80"}`}>
            {t.icon}
            {t.label}
            {!!t.badge && t.badge > 0 && (<span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-pinky text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-deep shadow-[0_0_10px_rgba(255,46,196,0.8)]">{t.badge}</span>)}
          </button>
        ))}
      </nav>
    </header>
  );
}
