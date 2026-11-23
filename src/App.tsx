import { useEffect, useRef, useState } from "react";
import ChatPanel from "./components/ChatPanel";
import Hud, { type Tab } from "./components/Hud";
import Onboarding from "./components/Onboarding";
import ProgressTab from "./components/ProgressTab";
import QuestMap from "./components/QuestMap";
import QuestPlayer from "./components/QuestPlayer";
import SettingsModal from "./components/SettingsModal";
import { Confetti, Modal, NeonButton, ToastHost } from "./components/ui";
import { ACHIEVEMENTS, ZONES } from "./game/content";
import { applyQuestFinish, buyExtraHeart, checkAchievements, dueWords, EXTRA_HEART_COST, xpToReachLevel } from "./game/engine";
import { parseHash, writeHash } from "./game/hash";
import { stopSpeaking } from "./game/speech";
import { defaultState, exportState, loadState, parseImportedState, saveState, todayStr } from "./game/storage";
import type { ChatMsg, FinishPayload, GameState, QuestDef, Settings, Toast, Zone } from "./game/types";

function SpaceBg() {
  return (<div className="fixed inset-0 z-0 bg-space overflow-hidden pointer-events-none"><div className="stars" /><div className="stars2" /><div className="grid-floor" /></div>);
}

export default function App() {
  const [state, setState] = useState<GameState>(() => loadState());
  const [tab, setTab] = useState<Tab>("map");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [active, setActive] = useState<{ zone: Zone; quest: QuestDef | null; bonusHearts: number } | null>(null);
  const [levelUpFx, setLevelUpFx] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const toastId = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => {
    const initial = parseHash(window.location.hash);
    if (initial === "play" || !window.location.hash) writeHash("map", "replace");
    else setTab(initial);
    const onHash = () => {
      const view = parseHash(window.location.hash);
      if (view === "play") {
        if (!activeRef.current) writeHash("map", "replace");
        return;
      }
      setActive(null);
      setTab(view);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const pushToast = (t: Omit<Toast, "id">) => { const id = ++toastId.current; setToasts((ts) => [...ts.slice(-2), { ...t, id }]); window.setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4000); };

  const handleOnboarding = (profile: { name: string; avatar: number }, startLevel: number) => {
    setState((s) => {
      const drafted: GameState = {
        ...s,
        profile,
        startLevel,
        xp: Math.max(s.xp, xpToReachLevel(startLevel)),
        streak: { count: 1, lastDay: todayStr() },
      };
      const unlocked = checkAchievements(drafted);
      return unlocked.length ? { ...drafted, achievements: [...drafted.achievements, ...unlocked] } : drafted;
    });
    pushToast({ title: "Добро пожаловать!", desc: profile.name + ", твой путь героя начинается!", tone: "cyan" });
  };

  const finishQuest = (p: FinishPayload) => {
    const { state: next, effects } = applyQuestFinish(state, p);
    setState(next);
    if (effects.leveledUpTo) {
      setLevelUpFx(true);
      window.setTimeout(() => setLevelUpFx(false), 3500);
      pushToast({ title: "Уровень " + effects.leveledUpTo + "!", desc: "Ты стал сильнее!", tone: "gold" });
    }
    for (const id of effects.newAchievements) {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) pushToast({ title: a.name, desc: a.desc, tone: "gold" });
    }
  };

  const doReset = () => { setState(defaultState()); setResetConfirm(false); setExitConfirm(false); writeHash("map", "replace"); setTab("map"); setActive(null); };
  const dueCount = dueWords(state).length;

  const goTab = (t: Tab) => { setTab(t); writeHash(t); };
  const startQuest = (zone: Zone, quest: QuestDef | null) => {
    stopSpeaking();
    const bonusHearts = (state.boosts.extraHearts ?? 0) > 0 ? 1 : 0;
    if (bonusHearts) setState((s) => ({ ...s, boosts: { extraHearts: Math.max(0, (s.boosts.extraHearts ?? 0) - 1) } }));
    const next = { zone, quest, bonusHearts };
    activeRef.current = next;
    setActive(next);
    writeHash("play");
  };
  const leaveQuest = () => {
    activeRef.current = null;
    setActive(null);
    writeHash(tab === "map" || tab === "chat" || tab === "progress" ? tab : "map", "replace");
  };
  const downloadProgress = () => {
    const blob = new Blob([exportState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neon-english-${state.profile?.name ?? "hero"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const importProgress = (raw: string) => {
    const next = parseImportedState(raw);
    if (!next) return false;
    setState(next);
    pushToast({ title: "Прогресс загружен", tone: "lime" });
    return true;
  };
  const buyHeart = () => {
    const next = buyExtraHeart(state);
    if (!next) {
      pushToast({ title: "Мало вольтов", desc: `Нужно ${EXTRA_HEART_COST}`, tone: "pink" });
      return;
    }
    setState(next);
    pushToast({ title: "Сердце в запасе!", desc: "Сработает в следующем квесте", tone: "gold" });
  };
  const speakSuccess = (stars: 2 | 3) => {
    const drafted: GameState = { ...state, speakDone: state.speakDone + 1, xp: state.xp + (stars === 3 ? 4 : 2), coins: state.coins + (stars === 3 ? 1 : 0) };
    const unlocked = checkAchievements(drafted);
    setState(unlocked.length ? { ...drafted, achievements: [...drafted.achievements, ...unlocked] } : drafted);
    if (stars === 3) pushToast({ title: "Произношение огонь!", desc: "+4 XP", tone: "lime" });
    for (const id of unlocked) {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) pushToast({ title: a.name, desc: a.desc, tone: "gold" });
    }
  };

  if (!state.profile) return (<><SpaceBg /><Onboarding onComplete={handleOnboarding} state={state} onPatch={(p: Partial<Settings>) => setState((s: GameState) => ({ ...s, settings: { ...s.settings, ...p } }))} /></>);

  return (
    <div className="min-h-screen bg-space relative">
      <SpaceBg />
      {levelUpFx && <Confetti count={60} />}
      <ToastHost toasts={toasts} />
      {!active ? (
        <>
          <Hud state={state} tab={tab} onTab={goTab} onSettings={() => setSettingsOpen(true)} onExit={() => setExitConfirm(true)} dueCount={dueCount} />
          <main className="relative z-10">
            {tab === "map" && <QuestMap state={state} onStart={(zone: Zone, quest: QuestDef) => startQuest(zone, quest)} onReview={() => startQuest(ZONES[0], null)} onLocked={(msg: string) => pushToast({ title: "Заперто!", desc: msg, tone: "pink" })} />}
            {tab === "chat" && <ChatPanel state={state} onAppend={(msgs: ChatMsg[]) => setState((s: GameState) => ({ ...s, chat: [...s.chat, ...msgs].slice(-120) }))} onToast={pushToast} onSpeakSuccess={speakSuccess} />}
            {tab === "progress" && <ProgressTab state={state} onBuyHeart={buyHeart} />}
          </main>
        </>
      ) : (
        <QuestPlayer zone={active.zone} quest={active.quest} state={state} bonusHearts={active.bonusHearts} onFinish={finishQuest} onExit={leaveQuest} onToast={pushToast} />
      )}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} state={state} onPatch={(p: Partial<Settings>) => setState((s: GameState) => ({ ...s, settings: { ...s.settings, ...p } }))} onReset={() => { setSettingsOpen(false); setResetConfirm(true); }} onExport={downloadProgress} onImport={importProgress} />
      <Modal open={resetConfirm} onClose={() => setResetConfirm(false)}>
        <h3 className="font-display text-lg text-hot uppercase">Сбросить прогресс?</h3>
        <p className="text-white/70 font-bold text-sm mt-2">Это действие нельзя отменить!</p>
        <div className="flex gap-3 mt-6"><NeonButton tone="dark" className="flex-1" onClick={() => setResetConfirm(false)}>Оставить</NeonButton><NeonButton tone="pink" className="flex-1" onClick={doReset}>Сбросить</NeonButton></div>
      </Modal>
      <Modal open={exitConfirm} onClose={() => setExitConfirm(false)}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-neon to-pinky flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.5)]"><span className="font-display text-2xl text-white">👋</span></div>
          <h3 className="font-display text-xl text-neon neon-cyan uppercase mt-4">До встречи, герой!</h3>
          <p className="text-white/70 font-bold text-sm mt-3">{state.profile?.name}, весь прогресс сохранён в этом браузере.</p>
          <p className="text-white/50 font-bold text-xs mt-3">Вкладку можно закрыть — или скачать копию прогресса в настройках.</p>
          <div className="mt-6"><NeonButton tone="cyan" className="w-full" onClick={() => setExitConfirm(false)}>Продолжить игру</NeonButton></div>
        </div>
      </Modal>
    </div>
  );
}
