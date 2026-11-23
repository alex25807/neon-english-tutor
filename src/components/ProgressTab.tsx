import type { ReactNode } from "react";
import { ACHIEVEMENTS, WORDS, ZONES } from "../game/content";
import { bossesDownCount, EXTRA_HEART_COST, levelInfo, masteredCount, questDoneCount, starsCount } from "../game/engine";
import { speak } from "../game/speech";
import type { GameState } from "../game/types";
import { IconBook, IconBolt, IconFlame, IconHeart, IconStar, IconTrophy } from "./icons";
import { Bar, NeonButton } from "./ui";

export default function ProgressTab({ state, onBuyHeart }: { state: GameState; onBuyHeart: () => void }) {
  const li = levelInfo(state.xp);
  const mastered = masteredCount(state);
  const totalWords = WORDS.length;
  const quests = questDoneCount(state);
  const stars = starsCount(state);
  const bosses = bossesDownCount(state);
  const canBuyHeart = state.coins >= EXTRA_HEART_COST;
  return (
    <div className="px-4 max-w-4xl mx-auto w-full py-6 space-y-6">
      <div className="bg-deep/90 border-2 border-edge rounded-3xl p-6">
        <h2 className="font-display text-xl text-neon neon-cyan uppercase">Твои успехи</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <StatCard icon={<IconTrophy className="w-6 h-6 text-goldy" />} value={li.level} label="Уровень" />
          <StatCard icon={<IconStar className="w-6 h-6 text-pinky" />} value={stars} label="Звёзд" />
          <StatCard icon={<IconFlame className="w-6 h-6 text-hot" />} value={state.streak.count} label="Серия дней" />
          <StatCard icon={<IconBook className="w-6 h-6 text-limey" />} value={mastered} label="Слов выучено" />
        </div>
        <div className="mt-6"><div className="flex items-center justify-between text-xs font-display uppercase tracking-widest text-white/50"><span>Опыт до следующего уровня</span><span className="text-neon">{li.into} / {li.need}</span></div><Bar value={li.into / li.need} tone="cyan" h="h-3" className="mt-2" /></div>
        <div className="mt-5"><div className="flex items-center justify-between text-xs font-display uppercase tracking-widest text-white/50"><span>Слов в словаре</span><span className="text-limey">{mastered} / {totalWords}</span></div><Bar value={mastered / totalWords} tone="lime" h="h-3" className="mt-2" /></div>
      </div>
      <div className="bg-deep/90 border-2 border-edge rounded-3xl p-6">
        <h3 className="font-display text-lg text-pinky neon-pink uppercase">Квесты и боссы</h3>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-panel border-2 border-edge rounded-xl p-4"><div className="font-display text-2xl text-goldy">{quests}</div><div className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mt-1">Квестов пройдено</div></div>
          <div className="bg-panel border-2 border-edge rounded-xl p-4"><div className="font-display text-2xl text-pinky">{bosses}/{ZONES.length}</div><div className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mt-1">Боссов побеждено</div></div>
        </div>
      </div>
      <div className="bg-deep/90 border-2 border-goldy/40 rounded-3xl p-6">
        <h3 className="font-display text-lg text-goldy neon-gold uppercase">Магазин Вольта</h3>
        <p className="text-white/60 font-bold text-xs mt-2">Вольты копятся за квесты. Потрать их на подмогу!</p>
        <div className="mt-4 flex items-center gap-4 flex-wrap bg-panel border-2 border-edge rounded-2xl p-4">
          <IconHeart className="w-8 h-8 text-hot" />
          <div className="flex-1 min-w-[160px]">
            <div className="font-extrabold text-sm text-white">Запасное сердце</div>
            <div className="text-[11px] font-bold text-white/50 mt-0.5">+1 жизнь в следующем квесте. В запасе: {state.boosts.extraHearts}</div>
          </div>
          <NeonButton tone="gold" size="sm" disabled={!canBuyHeart} onClick={onBuyHeart}>
            <IconBolt className="w-4 h-4" /> {EXTRA_HEART_COST}
          </NeonButton>
        </div>
      </div>
      <div className="bg-deep/90 border-2 border-edge rounded-3xl p-6">
        <h3 className="font-display text-lg text-goldy neon-gold uppercase">Достижения</h3>
        <div className="grid sm:grid-cols-2 gap-2 mt-4">
          {ACHIEVEMENTS.map((a) => {
            const got = state.achievements.includes(a.id);
            return (
              <div key={a.id} className={`rounded-xl border-2 px-3 py-2.5 ${got ? "border-goldy/50 bg-goldy/10" : "border-edge bg-panel opacity-55"}`}>
                <div className={`font-extrabold text-sm ${got ? "text-goldy" : "text-white/50"}`}>{got ? "★ " : "☆ "}{a.name}</div>
                <div className="text-[11px] font-bold text-white/45 mt-0.5">{a.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-deep/90 border-2 border-edge rounded-3xl p-6">
        <h3 className="font-display text-lg text-limey neon-lime uppercase">Словарь</h3>
        <div className="flex flex-wrap gap-2 mt-4">{WORDS.filter((w) => state.cards[w.id]?.seen).map((w) => (<button key={w.id} onClick={() => speak(w.en, { rate: state.settings.rate, gender: state.settings.voiceGender })} className="btn-arcade px-3 py-1.5 rounded-full bg-panel2 border-2 border-edge text-white font-extrabold text-xs hover:border-neon/60 hover:text-neon transition-colors">{w.emoji} {w.en} <span className="text-white/40">— {w.ru}</span></button>))}</div>
        {WORDS.filter((w) => state.cards[w.id]?.seen).length === 0 && <p className="text-white/40 font-bold text-sm mt-3">Пройди первый квест — слова появятся здесь.</p>}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (<div className="bg-panel border-2 border-edge rounded-xl p-4 flex items-center gap-3">{icon}<div><div className="font-display text-2xl text-white leading-none">{value}</div><div className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mt-1">{label}</div></div></div>);
}
