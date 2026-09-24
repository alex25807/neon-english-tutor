import { useEffect, useRef, useState } from "react";
import AIChat from "./components/AIChat";
import ChatPanel from "./components/ChatPanel";
import Hud, { type Tab } from "./components/Hud";
import Onboarding from "./components/Onboarding";
import ProgressTab from "./components/ProgressTab";
import QuestMap from "./components/QuestMap";
import QuestPlayer, { type FinishPayload } from "./components/QuestPlayer";
import SettingsModal from "./components/SettingsModal";
import { Confetti, Modal, NeonButton, ToastHost } from "./components/ui";
import { ACHIEVEMENTS, ZONES } from "./game/content";
import { checkAchievements, dueWords, emptyCard, levelInfo, updCard } from "./game/engine";
import { stopSpeaking } from "./game/speech";
import { defaultState, loadState, saveState, todayStr, yesterdayStr } from "./game/storage";
import type { ChatMsg, GameState, QuestDef, Settings, Toast, Zone } from "./game/types";

function SpaceBg() {
  return (<div className="fixed inset-0 z-0 bg-space overflow-hidden pointer-events-none"><div className="stars" /><div className="stars2" /><div className="grid-floor" /></div>);
}

export default function App() {
  const [state, setState] = useState<GameState>(() => loadState());
  const [tab, setTab] = useState<Tab>("map");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [active, setActive] = useState<{ zone: Zone; quest: QuestDef | null } | null>(null);
  const [levelUpFx, setLevelUpFx] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const toastId = useRef(0);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => () => stopSpeaking(), []);

  const pushToast = (t: Omit<Toast, "id">) => { const id = ++toastId.current; setToasts((ts) => [...ts.slice(-2), { ...t, id }]); window.setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4000); };

  const handleOnboarding = (profile: { name: string; avatar: number }, startLevel: number) => {
    setState((s) => ({ ...s, profile, startLevel, streak: { count: 1, lastDay: todayStr() } }));
    pushToast({ title: "Добро пожаловать!", desc: profile.name + ", твой путь героя начинается!", tone: "cyan" });
  };

  const finishQuest = (p: FinishPayload) => {
    setState((s: GameState) => {
      const now = Date.now();
      const next = { ...s, xp: s.xp + p.stats.xpEarned, coins: s.coins + p.stats.coinsEarned, speakDone: s.speakDone + p.stats.speakCount };
      const prevLevel = levelInfo(s.xp).level;
      const newLevel = levelInfo(next.xp).level;
      if (newLevel > prevLevel) { setLevelUpFx(true); window.setTimeout(() => setLevelUpFx(false), 3500); pushToast({ title: "Уровень " + newLevel + "!", desc: "Ты стал сильнее!", tone: "gold" }); }
      for (const [wid, ok] of Object.entries(p.wordResults)) { const w = next.cards[wid] ?? emptyCard(); next.cards[wid] = updCard(w, ok as boolean, now); }
      for (const [wid, count] of Object.entries(p.wrongCounts)) next.mistakes[wid] = (next.mistakes[wid] ?? 0) + (count as number);
      if (p.questId) {
        const prev = next.quests[p.questId] ?? { stars: 0, done: 0 };
        const total = p.stats.correct + p.stats.wrong;
        const acc = total ? p.stats.correct / total : 1;
        const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
        next.quests[p.questId] = { stars: Math.max(prev.stars, stars), done: prev.done + 1 };
      }
      if (p.perfect) next.perfects += 1;
      if (p.questId?.endsWith("-3") && p.stats.correct > 0) next.bossesDown += 1;
      const today = todayStr();
      if (next.streak.lastDay !== today) next.streak = { count: next.streak.lastDay === yesterdayStr() ? next.streak.count + 1 : 1, lastDay: today };
      const fresh = checkAchievements(next);
      if (fresh.length) {
        next.achievements = [...next.achievements, ...fresh];
        fresh.forEach((id: string) => { const a = ACHIEVEMENTS.find((x: { id: string }) => x.id === id); if (a) pushToast({ title: a.name, desc: a.desc, tone: "gold" }); });
      }
      return next;
    });
  };

  const doReset = () => { setState(defaultState()); setResetConfirm(false); setExitConfirm(false); };
  const dueCount = dueWords(state).length;

  if (!state.profile) return (<><SpaceBg /><Onboarding onComplete={handleOnboarding} state={state} onPatch={(p: Partial<Settings>) => setState((s: GameState) => ({ ...s, settings: { ...s.settings, ...p } }))} /></>);

  return (
    <div className="min-h-screen bg-space relative">
      <SpaceBg />
      {levelUpFx && <Confetti count={60} />}
      <ToastHost toasts={toasts} />
      {!active ? (
        <>
          <Hud state={state} tab={tab} onTab={setTab} onSettings={() => setSettingsOpen(true)} onExit={() => setExitConfirm(true)} dueCount={dueCount} />
          <main className="relative z-10">
            {tab === "map" && <QuestMap state={state} onStart={(zone: Zone, quest: QuestDef) => { stopSpeaking(); setActive({ zone, quest }); }} onReview={() => { stopSpeaking(); setActive({ zone: ZONES[0], quest: null }); }} onLocked={(msg: string) => pushToast({ title: "Заперто!", desc: msg, tone: "pink" })} />}
            {tab === "chat" && <ChatPanel state={state} onAppend={(msgs: ChatMsg[]) => setState((s: GameState) => ({ ...s, chat: [...s.chat, ...msgs].slice(-120) }))} onToast={pushToast} />}
            {tab === "ai" && <AIChat settings={state.settings} playerName={state.profile?.name ?? "герой"} />}
            {tab === "progress" && <ProgressTab state={state} />}
          </main>
        </>
      ) : (
        <QuestPlayer zone={active.zone} quest={active.quest} state={state} onFinish={finishQuest} onExit={() => setActive(null)} onToast={pushToast} />
      )}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} state={state} onPatch={(p: Partial<Settings>) => setState((s: GameState) => ({ ...s, settings: { ...s.settings, ...p } }))} onReset={() => { setSettingsOpen(false); setResetConfirm(true); }} />
      <Modal open={resetConfirm} onClose={() => setResetConfirm(false)}>
        <h3 className="font-display text-lg text-hot uppercase">Сбросить прогресс?</h3>
        <p className="text-white/70 font-bold text-sm mt-2">Это действие нельзя отменить!</p>
        <div className="flex gap-3 mt-6"><NeonButton tone="dark" className="flex-1" onClick={() => setResetConfirm(false)}>Оставить</NeonButton><NeonButton tone="pink" className="flex-1" onClick={doReset}>Сбросить</NeonButton></div>
      </Modal>
      <Modal open={exitConfirm} onClose={() => setExitConfirm(false)}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-neon to-pinky flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.5)]"><span className="font-display text-2xl text-white">👋</span></div>
          <h3 className="font-display text-xl text-neon neon-cyan uppercase mt-4">До встречи, герой!</h3>
          <p className="text-white/70 font-bold text-sm mt-3">{state.profile?.name}, весь прогресс сохранён!</p>
          <div className="flex gap-3 mt-6"><NeonButton tone="dark" className="flex-1" onClick={() => setExitConfirm(false)}>Остаться</NeonButton><NeonButton tone="pink" className="flex-1" onClick={() => { setExitConfirm(false); window.close(); }}>Выйти</NeonButton></div>
        </div>
      </Modal>
    </div>
  );
}
