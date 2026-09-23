import { WORDS } from "../game/content";
import { bossesDownCount, levelInfo, masteredCount, questDoneCount, starsCount } from "../game/engine";
import { speak } from "../game/speech";
import type { GameState } from "../game/types";
import { IconBook, IconFlame, IconStar, IconTrophy } from "./icons";
import { Bar } from "./ui";

export default function ProgressTab({ state }: { state: GameState }) {
  const li = levelInfo(state.xp);
  const mastered = masteredCount(state);
  const totalWords = WORDS.length;
  const quests = questDoneCount(state);
  const stars = starsCount(state);
  const bosses = bossesDownCount(state);
  const totalStars = state.quests ? Object.values(state.quests).reduce((s, q) => s + q.stars, 0) : 0;

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
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-display uppercase tracking-widest text-white/50">
            <span>Опыт до следующего уровня</span>
            <span className="text-neon">{li.into} / {li.need}</span>
          </div>
          <Bar value={li.into / li.need} tone="cyan" h="h-3" className="mt-2" />
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-display uppercase tracking-widest text-white/50">
            <span>Слов в словаре</span>
            <span className="text-limey">{mastered} / {totalWords}</span>
          </div>
          <Bar value={mastered / totalWords} tone="lime" h="h-3" className="mt-2" />
        </div>
      </div>

      <div className="bg-deep/90 border-2 border-edge rounded-3xl p-6">
        <h3 className="font-display text-lg text-pinky neon-pink uppercase">Квесты и боссы</h3>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-panel border-2 border-edge rounded-xl p-4">
            <div className="font-display text-2xl text-goldy">{quests}</div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mt-1">Квестов пройдено</div>
          </div>
          <div className="bg-panel border-2 border-edge rounded-xl p-4">
            <div className="font-display text-2xl text-pinky">{bosses}/6</div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mt-1">Боссов побеждено</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <IconStar className="w-5 h-5 text-goldy" />
          <span className="font-extrabold text-sm text-white">Всего звёзд: {totalStars}</span>
        </div>
      </div>

      {state.achievements.length > 0 && (
        <div className="bg-deep/90 border-2 border-edge rounded-3xl p-6">
          <h3 className="font-display text-lg text-goldy neon-gold uppercase">Достижения</h3>
          <div className="flex flex-wrap gap-2 mt-4">
            {state.achievements.map((id) => (
              <span key={id} className="px-3 py-1.5 rounded-full bg-goldy/15 border-2 border-goldy/50 text-goldy font-extrabold text-xs">{id}</span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-deep/90 border-2 border-edge rounded-3xl p-6">
        <h3 className="font-display text-lg text-limey neon-lime uppercase">Словарь</h3>
        <div className="flex flex-wrap gap-2 mt-4">
          {WORDS.filter((w) => state.cards[w.id]?.seen).map((w) => (
            <button key={w.id} onClick={() => speak(w.en, { rate: state.settings.rate, gender: state.settings.voiceGender })} className="btn-arcade px-3 py-1.5 rounded-full bg-panel2 border-2 border-edge text-white font-extrabold text-xs hover:border-neon/60 hover:text-neon transition-colors">
              {w.en} <span className="text-white/40">— {w.ru}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-panel border-2 border-edge rounded-xl p-4 flex items-center gap-3">
      {icon}
      <div>
        <div className="font-display text-2xl text-white leading-none">{value}</div>
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mt-1">{label}</div>
      </div>
    </div>
  );
}
