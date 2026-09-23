import { ZONES } from "../game/content";
import { levelInfo, questDoneCount, questUnlocked, zoneUnlocked } from "../game/engine";
import type { GameState, QuestDef, Zone } from "../game/types";
import { IconBolt, IconCheck, IconFlame, IconLock, IconPlay, IconPortal, IconRocket, IconStar, IconTrophy, Planet, VoltRobot } from "./icons";
import { NeonButton } from "./ui";

export default function QuestMap({ state, onStart, onReview, onLocked }: { state: GameState; onStart: (zone: Zone, quest: QuestDef) => void; onReview: () => void; onLocked: (msg: string) => void }) {
  const li = levelInfo(state.xp);
  const done = questDoneCount(state);
  const due = Object.values(state.cards).filter((c) => c.seen > 0 && c.due <= Date.now()).length;

  return (
    <div className="px-4 max-w-5xl mx-auto w-full py-6">
      <div className="flex items-center gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 bg-panel border-2 border-edge rounded-2xl px-4 py-3 flex-1 min-w-[260px]">
          <VoltRobot mood="happy" className="w-14 h-14 shrink-0 anim-bobble" />
          <div className="min-w-0">
            <div className="font-display text-xs uppercase tracking-widest text-neon">Привет, {state.profile?.name}!</div>
            <div className="text-white/75 font-bold text-sm leading-snug mt-0.5">Выбирай планету и вперёд — к новым словам и победам!</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
          <StatCard icon={<IconTrophy className="w-5 h-5 text-goldy" />} value={done} label="Квестов" />
          <StatCard icon={<IconStar className="w-5 h-5 text-pinky" />} value={Object.values(state.quests).reduce((s, q) => s + q.stars, 0)} label="Звёзд" />
          <StatCard icon={<IconFlame className="w-5 h-5 text-hot" />} value={state.streak.count} label="Серия" />
        </div>
      </div>

      {due > 0 && (
        <button onClick={onReview} className="btn-arcade w-full mb-6 rounded-2xl border-2 border-limey/60 bg-limey/10 px-5 py-4 flex items-center gap-4 text-left hover:bg-limey/15">
          <div className="w-14 h-14 rounded-xl bg-limey/20 border-2 border-limey flex items-center justify-center"><IconPortal className="w-7 h-7 text-limey" /></div>
          <div className="flex-1">
            <div className="font-display text-limey uppercase tracking-wide text-sm">Портал повторения</div>
            <div className="text-white/70 font-bold text-xs mt-0.5">Повтори {due} слов, которые пора освежить</div>
          </div>
          <NeonButton tone="lime" size="sm"><IconPlay className="w-4 h-4" /> Войти</NeonButton>
        </button>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {ZONES.map((zone, zi) => {
          const unlocked = zoneUnlocked(zone, li.level);
          return (
            <div key={zone.id} className={`rounded-2xl border-2 p-5 relative overflow-hidden ${unlocked ? "bg-deep/90 border-edge" : "bg-panel/40 border-edge/50 opacity-75"}`}>
              <div className="flex items-start gap-4">
                <div className="shrink-0 anim-floaty" style={{ animationDelay: `${zi * 0.3}s` }}><Planet hue={zone.hue} hue2={zone.hue2} ring={zone.ring} className="w-20 h-20" seed={zi} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg uppercase tracking-wide truncate" style={{ color: zone.hue, textShadow: `0 0 10px ${zone.hue}55` }}>{zone.title}</h3>
                    {!unlocked && <IconLock className="w-4 h-4 text-white/40 shrink-0" />}
                  </div>
                  <p className="text-white/55 font-bold text-xs mt-0.5">{zone.subtitle}</p>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-white/35 mt-1">Уровень {zone.reqLevel}+</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {zone.quests.map((quest, qi) => {
                  const qUnlocked = questUnlocked(state, zone, qi);
                  const qDone = state.quests[quest.id]?.done ?? 0;
                  const stars = state.quests[quest.id]?.stars ?? 0;
                  const isBoss = quest.kind === "boss";
                  return (
                    <button key={quest.id} onClick={() => { if (!unlocked) { onLocked(`Нужен уровень ${zone.reqLevel}`); return; } if (!qUnlocked) { onLocked("Сначала пройди предыдущий квест!"); return; } onStart(zone, quest); }} className={`btn-arcade w-full rounded-xl border-2 px-4 py-3 flex items-center gap-3 text-left transition-colors ${!qUnlocked ? "border-edge bg-panel text-white/30" : isBoss ? "border-pinky/60 bg-pinky/10 text-white hover:bg-pinky/15" : "border-edge bg-panel text-white hover:border-neon/60 hover:bg-panel2"}`}>
                      <span className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-display text-xs shrink-0 ${!qUnlocked ? "border-edge text-white/25" : isBoss ? "border-pinky text-pinky" : "border-neon text-neon"}`}>{qi + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-sm truncate">{quest.title}</div>
                        <div className="text-[10px] font-bold text-white/45 uppercase tracking-wider">{isBoss ? "Битва с боссом" : qDone > 0 ? `Пройдено • ${stars}/3 ★` : `${quest.steps} заданий`}</div>
                      </div>
                      {qDone > 0 ? <IconCheck className="w-5 h-5 text-limey shrink-0" /> : qUnlocked ? <IconRocket className="w-5 h-5 text-neon shrink-0" /> : <IconLock className="w-5 h-5 text-white/25 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-panel border-2 border-edge rounded-xl px-3 py-2.5 flex items-center gap-2">
      {icon}
      <div>
        <div className="font-display text-lg text-white leading-none">{value}</div>
        <div className="text-[9px] font-extrabold uppercase tracking-widest text-white/40 mt-0.5">{label}</div>
      </div>
    </div>
  );
}
