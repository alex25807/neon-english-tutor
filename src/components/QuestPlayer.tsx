import { useEffect, useRef, useState } from "react";
import { VOLT_INTRO_LINES, VOLT_OOPS, VOLT_PRAISE } from "../game/content";
import { buildQuestRun, buildReviewRun, shuffle } from "../game/engine";
import { speak, speechMatches, startListening, sttSupported, stopSpeaking, ttsSupported } from "../game/speech";
import type { Exercise, GameState, QuestDef, RunStats, Sentence, Settings, Toast, Word, Zone } from "../game/types";
import { IconArrowRight, IconBoss, IconCheck, IconHeart, IconMic, IconRefresh, IconSpeaker, IconX, VoltRobot } from "./icons";
import { Bar, Confetti, Modal, NeonButton, StarRow } from "./ui";

export interface FinishPayload { questId: string | null; stats: RunStats; wordResults: Record<string, boolean>; wrongCounts: Record<string, number>; perfect: boolean; }
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
type Mood = "happy" | "sad" | "wow" | "cool";

export default function QuestPlayer({ zone, quest, state, onFinish, onExit, onToast }: { zone: Zone; quest: QuestDef | null; state: GameState; onFinish: (p: FinishPayload) => void; onExit: () => void; onToast: (t: Omit<Toast, "id">) => void }) {
  const [retry, setRetry] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const run = useRef(quest ? buildQuestRun(zone, quest, state) : buildReviewRun(state)).current;
  if (run.length === 0) return (<div className="fixed inset-0 z-40 bg-void/95 backdrop-blur-sm overflow-y-auto py-8 px-4"><div className="relative z-10 max-w-md mx-auto text-center bg-deep/95 border-2 border-edge rounded-3xl p-8 anim-slide-up"><VoltRobot mood="cool" className="w-24 h-24 mx-auto anim-bobble" /><h2 className="font-display text-xl text-neon neon-cyan uppercase mt-4">Портал пуст</h2><p className="text-white/70 font-bold text-sm mt-2">Сейчас все слова повторены. Пройди новый квест!</p><NeonButton tone="cyan" size="lg" className="mt-6 w-full" onClick={onExit}>К карте галактики</NeonButton></div></div>);
  return (<><RunInner key={retry} zone={zone} quest={quest} run={run} settings={state.settings} playerName={state.profile?.name ?? "герой"} onFinish={onFinish} onExitRequest={() => setConfirmExit(true)} onExitDirect={onExit} onRetry={() => setRetry((r) => r + 1)} onToast={onToast} /><Modal open={confirmExit} onClose={() => setConfirmExit(false)}><h3 className="font-display text-lg text-white uppercase">Покинуть квест?</h3><p className="text-white/70 font-bold text-sm mt-2">Прогресс этого забега не сохранится. Точно уходим?</p><div className="flex gap-3 mt-6"><NeonButton tone="dark" className="flex-1" onClick={() => setConfirmExit(false)}>Остаться</NeonButton><NeonButton tone="pink" className="flex-1" onClick={onExit}>Выйти</NeonButton></div></Modal></>);
}

function RunInner({ zone, quest, run, settings, playerName, onFinish, onExitRequest, onExitDirect, onRetry, onToast }: { zone: Zone; quest: QuestDef | null; run: Exercise[]; settings: Settings; playerName: string; onFinish: (p: FinishPayload) => void; onExitRequest: () => void; onExitDirect: () => void; onRetry: () => void; onToast: (t: Omit<Toast, "id">) => void }) {
  const isBoss = quest?.kind === "boss";
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"task" | "feedback">("task");
  const [fb, setFb] = useState<{ ok: boolean; info: string }>({ ok: true, info: "" });
  const [hearts, setHearts] = useState(3);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [volt, setVolt] = useState<{ text: string; mood: Mood }>({ text: "Поехали!", mood: "cool" });
  const [wordResults, setWordResults] = useState<Record<string, boolean>>({});
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  const [newWords, setNewWords] = useState<Word[]>([]);
  const [speakCount, setSpeakCount] = useState(0);
  const [zap, setZap] = useState(0);
  const [shake, setShake] = useState(false);
  const [floats, setFloats] = useState<{ id: number; val: number; top: number }[]>([]);
  const [finished, setFinished] = useState<"win" | "fail" | null>(null);
  const wrongCounts = useRef<Record<string, number>>({});
  const timers = useRef<number[]>([]);
  const finishSent = useRef(false);
  const floatId = useRef(0);

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => () => stopSpeaking(), []);

  const ex = run[idx];

  useEffect(() => {
    const line = VOLT_INTRO_LINES[ex.kind];
    setVolt({ text: line, mood: "cool" });
    let dead = false;
    (async () => { if (!ttsSupported) return; stopSpeaking(); if (settings.voltTalks) await speak(line, { lang: "ru-RU", rate: settings.rate + 0.1, gender: settings.voiceGender }); if (dead || !settings.voiceOn) return; if (ex.kind === "intro" || ex.kind === "listenChoice" || ex.kind === "speak") speak(ex.word.en, { rate: settings.rate, gender: settings.voiceGender }); else if (ex.kind === "match") speak(ex.pairs.map((p) => p.en).join(", "), { rate: settings.rate, gender: settings.voiceGender }); })();
    return () => { dead = true; };
  }, [idx]);

  const voltSay = async (text: string, mood: Mood, enAfter?: string) => { setVolt({ text, mood }); if (!ttsSupported) return; stopSpeaking(); if (settings.voltTalks) await speak(text, { lang: "ru-RU", rate: settings.rate + 0.1, gender: settings.voiceGender }); if (enAfter && settings.voiceOn) speak(enAfter, { rate: settings.rate, gender: settings.voiceGender }); };
  const addFloat = (val: number) => { const id = ++floatId.current; const top = (id % 4) * 26; setFloats((f) => [...f, { id, val, top }]); later(() => setFloats((f) => f.filter((x) => x.id !== id)), 1100); };
  const advance = () => { if (idx + 1 >= run.length) setFinished("win"); else { setIdx((i) => i + 1); setPhase("task"); } };

  const judge = (ok: boolean, opts: { word?: Word; info?: string; noHeart?: boolean; enAfter?: string } = {}) => {
    if (phase !== "task" || finished) return;
    const { word, info = "", noHeart } = opts;
    if (word) setWordResults((p) => ({ ...p, [word.id]: ok }));
    if (ok) {
      const gained = 10 + Math.min(10, combo * 2);
      setXp((v) => v + gained); setCoins((v) => v + 1);
      setCombo((c) => { const n = c + 1; setMaxCombo((m) => Math.max(m, n)); return n; });
      setCorrect((n) => n + 1); addFloat(gained); setZap((z) => z + 1); setFb({ ok: true, info }); setPhase("feedback");
      void voltSay(pick(VOLT_PRAISE), "happy", opts.enAfter); later(advance, 1150);
    } else {
      setCombo(0); setWrong((n) => n + 1);
      if (word) { wrongCounts.current[word.id] = (wrongCounts.current[word.id] ?? 0) + 1; setWrongWords((w) => (w.some((x) => x.id === word.id) ? w : [...w, word])); }
      const nh = noHeart ? hearts : hearts - 1;
      if (!noHeart) setHearts(nh); setShake(true); later(() => setShake(false), 500);
      setFb({ ok: false, info }); setPhase("feedback"); void voltSay(pick(VOLT_OOPS), "sad", opts.enAfter);
      later(() => { if (nh <= 0) setFinished("fail"); else advance(); }, 1600);
    }
  };

  useEffect(() => {
    if (finished !== "win" || finishSent.current) return;
    finishSent.current = true;
    const total = correct + wrong; const acc = total ? correct / total : 1;
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
    const bonusXp = stars * 15 + (isBoss ? 25 : 0); const bonusCoins = stars * 5 + (isBoss ? 15 : 0);
    const stats: RunStats = { correct, wrong, xpEarned: xp + bonusXp, coinsEarned: coins + bonusCoins, maxCombo, wrongWords, newWords, speakCount };
    onFinish({ questId: quest?.id ?? null, stats, wordResults, wrongCounts: wrongCounts.current, perfect: wrong === 0 && correct >= 4 });
  }, [finished]);

  if (finished === "fail") return (<div className="fixed inset-0 z-40 bg-void/95 backdrop-blur-sm overflow-y-auto py-8 px-4"><div className="relative z-10 max-w-md mx-auto text-center bg-deep/95 border-2 border-hot/60 rounded-3xl p-8 anim-slide-up shadow-[0_0_50px_rgba(255,84,112,0.25)]"><VoltRobot mood="sad" className="w-24 h-24 mx-auto anim-bobble" /><h2 className="font-display text-2xl text-hot uppercase mt-4" style={{ textShadow: "0 0 14px rgba(255,84,112,0.7)" }}>Сердца закончились</h2><p className="text-white/70 font-bold text-sm mt-2 leading-relaxed">{playerName}, босс коварен, но ты уже знаешь больше! Пробуем ещё?</p><div className="flex gap-3 mt-7"><NeonButton tone="dark" className="flex-1" onClick={onExitDirect}>Выйти</NeonButton><NeonButton tone="lime" className="flex-1" onClick={onRetry}><IconRefresh className="w-4 h-4" /> Ещё раз</NeonButton></div></div></div>);

  if (finished === "win") {
    const total = correct + wrong; const acc = total ? Math.round((correct / total) * 100) : 100;
    const stars = acc >= 90 ? 3 : acc >= 70 ? 2 : 1;
    return (<div className="fixed inset-0 z-40 bg-void/95 backdrop-blur-sm overflow-y-auto py-8 px-4"><div className="relative z-10">{stars >= 2 && <Confetti />}<div className="max-w-lg mx-auto text-center bg-deep/95 border-2 rounded-3xl p-8 anim-slide-up" style={{ borderColor: isBoss ? "#ff2ec4" : "#372383", boxShadow: isBoss ? "0 0 60px rgba(255,46,196,0.35)" : "0 0 60px rgba(139,92,246,0.25)" }}><VoltRobot mood={stars === 3 ? "wow" : "happy"} className="w-20 h-20 mx-auto anim-bobble" /><h2 className={`font-display text-2xl mt-3 uppercase ${isBoss ? "text-pinky neon-pink" : "text-limey neon-lime"}`}>{isBoss ? "Босс повержен!" : quest ? "Квест пройден!" : "Тренировка готова!"}</h2><div className="mt-4"><StarRow n={stars} size="w-12 h-12" animate /></div><div className="grid grid-cols-3 gap-3 mt-6"><StatChip label="Опыт" value={`+${xp}`} tone="text-goldy" /><StatChip label="Вольты" value={`+${coins}`} tone="text-neon" /><StatChip label="Точность" value={`${acc}%`} tone="text-limey" /></div>{maxCombo >= 3 && <p className="text-pinky font-extrabold text-sm mt-3">Максимальное комбо: x{maxCombo}!</p>}{newWords.length > 0 && <div className="mt-5 text-left"><h4 className="font-display text-xs uppercase tracking-widest text-white/50">Новые слова</h4><div className="flex flex-wrap gap-2 mt-2">{newWords.map((w) => (<WordChip key={w.id} word={w} tone="lime" rate={settings.rate} gender={settings.voiceGender} />))}</div></div>}{wrongWords.length > 0 && <div className="mt-4 text-left"><h4 className="font-display text-xs uppercase tracking-widest text-white/50">Повтори их ещё раз</h4><div className="flex flex-wrap gap-2 mt-2">{wrongWords.map((w) => (<WordChip key={w.id} word={w} tone="pink" rate={settings.rate} gender={settings.voiceGender} />))}</div></div>}<NeonButton tone="cyan" size="lg" className="w-full mt-7" onClick={onExitDirect}>К карте галактики <IconArrowRight className="w-5 h-5" /></NeonButton></div></div></div>);
  }

  const bossHp = run.length - correct;
  return (<div className="fixed inset-0 z-40 bg-void/95 backdrop-blur-sm overflow-y-auto py-8 px-4"><div className="relative z-10 max-w-3xl mx-auto"><div className="flex items-center gap-3 flex-wrap"><button onClick={onExitRequest} className="btn-arcade w-10 h-10 rounded-xl bg-panel border-2 border-edge text-white/60 hover:text-hot hover:border-hot/60 flex items-center justify-center" aria-label="Выйти"><IconX className="w-4 h-4" /></button><div className="min-w-0 flex-1"><div className="font-display text-xs uppercase tracking-widest truncate" style={{ color: zone.hue }}>{quest ? (isBoss ? "Битва с боссом" : zone.title) : "Портал повторения"}</div><Bar value={(idx + (phase === "feedback" ? 1 : 0)) / run.length} tone={isBoss ? "pink" : "cyan"} h="h-2.5" className="mt-1" /></div>{combo >= 2 && <span className="anim-pop font-display text-sm text-pinky neon-pink whitespace-nowrap">Комбо x{combo}</span>}<div className="flex gap-1">{[0, 1, 2].map((i) => (<IconHeart key={i} className={`w-6 h-6 ${i < hearts ? "text-hot drop-shadow-[0_0_8px_rgba(255,84,112,0.9)]" : "text-white/10"}`} off={i >= hearts} />))}</div></div>{isBoss && <div className="mt-4 flex items-center gap-4 bg-[#2a0a2a]/80 border-2 border-pinky/50 rounded-2xl px-4 py-3"><div key={zap} className={zap > 0 ? "anim-zap" : ""}><IconBoss className="w-14 h-14 text-pinky drop-shadow-[0_0_14px_rgba(255,46,196,0.9)]" /></div><div className="flex-1"><div className="flex items-center justify-between"><span className="font-display text-sm text-pinky uppercase tracking-wide">{quest?.title ?? "Босс"}</span><span className="text-[10px] font-extrabold text-white/50">HP {bossHp}/{run.length}</span></div><Bar value={bossHp / run.length} tone="pink" h="h-3" className="mt-1.5" /></div></div>}<div className={`relative mt-5 bg-deep/95 border-2 border-edge rounded-3xl p-6 min-h-[380px] ${shake ? "anim-shake" : ""}`}><div className="pointer-events-none absolute right-6 top-2 z-20">{floats.map((f) => (<span key={f.id} style={{ top: f.top }} className="anim-rise absolute right-0 font-display text-xl text-goldy neon-gold whitespace-nowrap">+{f.val} XP</span>))}</div>{phase === "task" && <TaskView key={idx} ex={ex} settings={settings} judge={judge} addNewWord={(w) => setNewWords((nw) => (nw.some((x) => x.id === w.id) ? nw : [...nw, w]))} advanceIntro={advance} setSpeakCount={setSpeakCount} onToast={onToast} />}{phase === "feedback" && <div className={`anim-slide-up rounded-2xl border-2 p-5 ${fb.ok ? "border-limey/70 bg-limey/10" : "border-hot/70 bg-hot/10"}`}><div className="flex items-center gap-3"><span className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${fb.ok ? "bg-limey text-[#132502] border-[#d3ff8a]" : "bg-hot text-white border-[#ff9bae]"}`}>{fb.ok ? <IconCheck className="w-6 h-6" /> : <IconX className="w-5 h-5" />}</span><div><div className={`font-display text-lg uppercase ${fb.ok ? "text-limey neon-lime" : "text-hot"}`}>{fb.ok ? "Верно!" : "Ошибка!"}</div>{fb.info && <div className="text-white/85 font-extrabold text-sm mt-0.5">{fb.info}</div>}</div></div></div>}<div className="mt-6 flex items-end gap-3"><VoltRobot mood={volt.mood} className="w-14 h-14 shrink-0 anim-bobble" /><div className="relative flex-1 bg-panel border-2 border-edge rounded-2xl rounded-bl-sm px-4 py-3"><p className="text-white/90 font-bold text-sm leading-snug">{volt.text}</p><span className="absolute -bottom-2 left-6 w-3 h-3 bg-panel border-b-2 border-l-2 border-edge rotate-45" /></div></div></div></div></div>);
}

function TaskView({ ex, settings, judge, addNewWord, advanceIntro, setSpeakCount, onToast }: { ex: Exercise; settings: Settings; judge: (ok: boolean, opts?: { word?: Word; info?: string; noHeart?: boolean; enAfter?: string }) => void; addNewWord: (w: Word) => void; advanceIntro: () => void; setSpeakCount: React.Dispatch<React.SetStateAction<number>>; onToast: (t: Omit<Toast, "id">) => void }) {
  const rate = settings.rate;
  const gender = settings.voiceGender;
  if (ex.kind === "intro") return (<div className="text-center anim-slide-up"><span className="font-display text-[10px] uppercase tracking-[0.3em] text-neon">Новое слово</span><div className="font-display text-5xl md:text-6xl text-white mt-4" style={{ textShadow: "0 0 24px rgba(0,229,255,0.5)" }}>{ex.word.en}</div><div className="text-white/70 font-extrabold text-xl mt-3">{ex.word.ru}</div><button onClick={() => speak(ex.word.en, { rate, gender })} className="btn-arcade mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-panel2 border-2 border-neon/60 text-neon font-extrabold text-sm"><IconSpeaker className="w-4 h-4" /> Послушать ещё</button><div className="mt-7"><NeonButton tone="lime" size="lg" onClick={() => { addNewWord(ex.word); advanceIntro(); }}>Запомнил! <IconArrowRight className="w-5 h-5" /></NeonButton></div></div>);
  if (ex.kind === "listenChoice" || ex.kind === "ruToEn" || ex.kind === "enToRu") {
    const prompt = ex.kind === "listenChoice" ? "Прослушай и выбери перевод" : ex.kind === "ruToEn" ? "Как сказать по-английски:" : "Что значит это слово:";
    const shown = ex.kind === "listenChoice" ? null : ex.kind === "ruToEn" ? ex.word.ru.toUpperCase() : ex.word.en;
    return (<ChoiceTask prompt={prompt} shown={shown} options={ex.options} correct={ex.kind === "ruToEn" ? ex.word.en : ex.word.ru} rate={rate} gender={gender} bigPlay={ex.kind === "listenChoice"} onPick={(opt) => judge(opt === (ex.kind === "ruToEn" ? ex.word.en : ex.word.ru), { word: ex.word, info: `${ex.word.en} — ${ex.word.ru}`, enAfter: ex.word.en })} />);
  }
  if (ex.kind === "gap") { const t = ex.task; return (<ChoiceTask prompt="Заполни пропуск" shown={`${t.before} ___ ${t.after}`.trim()} shownSmall options={t.options} correct={t.answer} rate={rate} gender={gender} onPick={(opt) => judge(opt === t.answer, { info: `${t.before} ${t.answer} ${t.after}`.replace(/\s+/g, " ").trim() + ` — ${t.hint}` })} />); }
  if (ex.kind === "spell") return (<div className="anim-slide-up"><TaskHeader title="Собери слово из букв" sub={`Перевод: ${ex.word.ru}`} rate={rate} gender={gender} enText={ex.word.en} /><Speller word={ex.word} tiles={ex.tiles} onDone={(ok) => judge(ok, { word: ex.word, info: `${ex.word.en} — ${ex.word.ru}`, enAfter: ex.word.en })} /></div>);
  if (ex.kind === "match") return (<div className="anim-slide-up"><TaskHeader title="Соедини пары" sub="Английский + русский" /><Matcher pairs={ex.pairs} onWrongPair={() => judge(false, { noHeart: true, info: "Не та пара! Попробуй ещё" })} onAllMatched={(errorIds) => { if (errorIds.size === 0) ex.pairs.forEach((w) => judge(true, { word: w, info: "Все пары собраны!" })); else ex.pairs.forEach((w) => { if (errorIds.has(w.id)) judge(false, { word: w, noHeart: true, info: `${w.en} — ${w.ru}` }); else judge(true, { word: w, noHeart: true }); }); }} /></div>);
  if (ex.kind === "build") return (<div className="anim-slide-up"><TaskHeader title="Собери предложение" sub={`Перевод: ${ex.sentence.ru}`} rate={rate} gender={gender} enText={ex.sentence.en} /><Builder sentence={ex.sentence} tiles={ex.tiles} onDone={(ok) => judge(ok, { info: `${ex.sentence.en} — ${ex.sentence.ru}`, enAfter: ex.sentence.en })} /></div>);
  return (<div className="anim-slide-up"><TaskHeader title="Произнеси слово в микрофон" sub={`Слово: ${ex.word.ru}`} rate={rate} gender={gender} enText={ex.word.en} bigPlay /><SpeakerTask word={ex.word} rate={rate} gender={gender} onToast={onToast} onResult={(ok, heard) => { if (ok) setSpeakCount((n) => n + 1); judge(ok, { word: ex.word, info: ok ? `Распознано: «${heard}»` : `Правильно: ${ex.word.en}`, enAfter: ex.word.en }); }} /></div>);
}

function TaskHeader({ title, sub, rate, gender, enText, bigPlay }: { title: string; sub: string; rate?: number; gender?: "male" | "female" | "default"; enText?: string; bigPlay?: boolean }) {
  return (<div className="text-center mb-6"><span className="font-display text-[10px] uppercase tracking-[0.3em] text-neon">{title}</span><div className="flex items-center justify-center gap-3 mt-3"><span className="font-display text-2xl md:text-3xl text-goldy neon-gold">{sub}</span>{(bigPlay || enText) && rate !== undefined && <button onClick={() => enText && speak(enText, { rate, gender: gender ?? "default" })} className="btn-arcade w-11 h-11 rounded-xl bg-panel2 border-2 border-neon/60 text-neon flex items-center justify-center shrink-0" aria-label="Прослушать"><IconSpeaker className="w-5 h-5" /></button>}</div></div>);
}

function ChoiceTask({ prompt, shown, options, correct, rate, gender, onPick, bigPlay, shownSmall }: { prompt: string; shown: string | null; options: string[]; correct: string; rate: number; gender?: "male" | "female" | "default"; onPick: (opt: string) => void; bigPlay?: boolean; shownSmall?: boolean }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (<div className="anim-slide-up"><div className="text-center mb-6"><span className="font-display text-[10px] uppercase tracking-[0.3em] text-neon">{prompt}</span>{bigPlay ? <button onClick={() => speak(options[options.indexOf(correct)], { rate, gender: gender ?? "default" })} className="btn-arcade mt-4 mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-[#00e5ff] to-[#4d7cff] text-[#04252b] flex items-center justify-center shadow-[0_0_34px_rgba(0,229,255,0.6)] border-4 border-[#8ffbff]" aria-label="Прослушать слово"><IconSpeaker className="w-10 h-10" /></button> : shown && <div className={`font-display mt-3 text-white ${shownSmall ? "text-xl md:text-2xl" : "text-3xl md:text-4xl"}`} style={{ textShadow: "0 0 20px rgba(255,214,10,0.35)" }}>{shown}</div>}</div><div className={`grid gap-3 ${options.length > 3 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>{options.map((opt, i) => { const isPicked = picked === opt; const isCorrect = picked && opt === correct; return (<button key={opt + i} onClick={() => { if (picked) return; setPicked(opt); onPick(opt); }} disabled={!!picked} className={`btn-arcade flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left font-extrabold text-base md:text-lg transition-colors ${isCorrect ? "border-limey bg-limey/15 text-limey shadow-[0_0_18px_rgba(163,255,18,0.4)]" : isPicked ? "border-hot bg-hot/15 text-hot anim-shake" : "border-edge bg-panel text-white hover:border-neon/70 hover:bg-panel2"}`}><span className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center font-display text-xs shrink-0 ${isCorrect ? "border-limey" : isPicked ? "border-hot" : "border-edge text-white/40"}`}>{["A", "B", "C", "D"][i]}</span>{opt}</button>); })}</div></div>);
}

function Speller({ word, tiles, onDone }: { word: Word; tiles: string[]; onDone: (ok: boolean) => void }) {
  const letters = word.en.split("");
  const [pool] = useState(() => tiles.map((ch, i) => ({ id: i, ch })));
  const [placed, setPlaced] = useState<number[]>([]);
  const done = useRef(false);
  useEffect(() => { if (placed.length === letters.length && !done.current) { done.current = true; const t = setTimeout(() => { const attempt = placed.map((id) => pool[id].ch).join(""); onDone(attempt === word.en); }, 400); return () => clearTimeout(t); } }, [placed, letters.length, pool, word.en, onDone]);
  return (<div className="text-center"><div className="flex flex-wrap justify-center gap-2 min-h-14">{letters.map((_, i) => { const tileId = placed[i]; return (<button key={i} onClick={() => tileId !== undefined && setPlaced((p) => p.filter((_, j) => j !== i))} className={`w-11 h-12 rounded-xl border-2 font-display text-2xl flex items-center justify-center transition-all ${tileId !== undefined ? "bg-panel2 border-neon text-white shadow-[0_0_12px_rgba(0,229,255,0.4)] cursor-pointer" : "bg-[#0d0730] border-edge border-dashed text-transparent"}`}>{tileId !== undefined ? pool[tileId].ch : "_"}</button>); })}</div><div className="flex flex-wrap justify-center gap-2 mt-7">{pool.map((t) => { const used = placed.includes(t.id); return (<button key={t.id} onClick={() => !used && setPlaced((p) => [...p, t.id])} disabled={used} className={`btn-arcade w-11 h-12 rounded-xl border-2 font-display text-xl ${used ? "opacity-15 border-edge bg-panel text-white/30" : "bg-pinky/15 border-pinky text-pinky shadow-[0_4px_0_#a1127a] hover:bg-pinky/25"}`}>{t.ch}</button>); })}</div></div>);
}

function Matcher({ pairs, onWrongPair, onAllMatched }: { pairs: Word[]; onWrongPair: () => void; onAllMatched: (errorIds: Set<string>) => void }) {
  const [left] = useState(() => shuffle(pairs));
  const [right] = useState(() => shuffle(pairs));
  const [sel, setSel] = useState<{ side: "l" | "r"; id: string } | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<{ l: string; r: string } | null>(null);
  const errors = useRef<Set<string>>(new Set());
  const click = (side: "l" | "r", w: Word) => {
    if (matched.has(w.id) || flash) return;
    if (!sel) return setSel({ side, id: w.id });
    if (sel.side === side) return setSel({ side, id: w.id });
    const enW = side === "l" ? w : (left.find((x) => x.id === sel.id) as Word);
    const ruW = side === "r" ? w : (right.find((x) => x.id === sel.id) as Word);
    if (enW.id === ruW.id) { const m = new Set(matched); m.add(w.id); setMatched(m); setSel(null); if (m.size === pairs.length) setTimeout(() => onAllMatched(errors.current), 350); }
    else { errors.current.add(enW.id); errors.current.add(ruW.id); setFlash({ l: enW.id, r: ruW.id }); setSel(null); onWrongPair(); setTimeout(() => setFlash(null), 550); }
  };
  const btn = (side: "l" | "r", w: Word, text: string) => { const isMatched = matched.has(w.id); const isSel = sel?.side === side && sel.id === w.id; const isFlash = flash && ((side === "l" && flash.l === w.id) || (side === "r" && flash.r === w.id)); return (<button key={side + w.id} onClick={() => click(side, w)} className={`btn-arcade w-full rounded-xl border-2 px-3 py-3 font-extrabold text-sm md:text-base transition-all ${isMatched ? "border-limey/70 bg-limey/10 text-limey/80 opacity-60" : isFlash ? "border-hot bg-hot/20 text-hot anim-shake" : isSel ? "border-neon bg-neon/15 text-neon shadow-[0_0_16px_rgba(0,229,255,0.5)]" : "border-edge bg-panel text-white hover:border-neon/60"}`}>{text}</button>); };
  return (<div className="grid grid-cols-2 gap-3"><div className="space-y-3">{left.map((w) => btn("l", w, w.en))}</div><div className="space-y-3">{right.map((w) => btn("r", w, w.ru))}</div></div>);
}

function Builder({ sentence, tiles, onDone }: { sentence: Sentence; tiles: string[]; onDone: (ok: boolean) => void }) {
  const [bank] = useState(() => tiles.map((t, i) => ({ id: i, text: t })));
  const [placed, setPlaced] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const check = () => { if (checked) return; setChecked(true); const attempt = placed.map((id) => bank[id].text).join(" "); onDone(attempt === sentence.tokens.join(" ")); };
  return (<div><div className="flex flex-wrap justify-center gap-2 min-h-14 bg-[#0d0730] border-2 border-dashed border-edge rounded-2xl p-3">{placed.length === 0 && <span className="text-white/25 font-bold text-sm self-center">Нажимай на слова снизу...</span>}{placed.map((id, i) => (<button key={i} onClick={() => !checked && setPlaced((p) => p.filter((x) => x !== id))} className="btn-arcade px-3.5 py-2 rounded-lg bg-neon text-[#04252b] font-extrabold text-sm shadow-[0_3px_0_#0891b2]">{bank[id].text}</button>))}</div><div className="flex flex-wrap justify-center gap-2 mt-5">{bank.map((t) => { const used = placed.includes(t.id); return (<button key={t.id} onClick={() => !used && !checked && setPlaced((p) => [...p, t.id])} disabled={used || checked} className={`btn-arcade px-3.5 py-2 rounded-lg border-2 font-extrabold text-sm ${used ? "opacity-15 border-edge bg-panel text-white/30" : "bg-panel2 border-viol text-white shadow-[0_3px_0_#5b21b6] hover:border-neon"}`}>{t.text}</button>); })}</div><div className="text-center mt-6"><NeonButton tone="gold" onClick={check} disabled={placed.length === 0 || checked}>Проверить <IconCheck className="w-4 h-4" /></NeonButton></div></div>);
}

function SpeakerTask({ word, rate, gender, onResult, onToast }: { word: Word; rate: number; gender?: "male" | "female" | "default"; onResult: (ok: boolean, heard: string) => void; onToast: (t: Omit<Toast, "id">) => void }) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [typed, setTyped] = useState("");
  const recRef = useRef<{ stop: () => void } | null>(null);
  const finished = useRef(false);
  useEffect(() => () => recRef.current?.stop(), []);
  const finish = (ok: boolean, heard: string) => { if (finished.current) return; finished.current = true; onResult(ok, heard); };
  const toggleMic = () => {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = startListening({ lang: "en-US", onInterim: setInterim, onFinal: (text) => { setInterim(text); setListening(false); finish(speechMatches(word.en, text), text); }, onEnd: () => setListening(false), onError: (err) => { setListening(false); if (err === "not-allowed" || err === "service-not-allowed") onToast({ title: "Нет доступа к микрофону", desc: "Напиши слово вручную", tone: "pink" }); else if (err !== "aborted" && err !== "no-speech") onToast({ title: "Микрофон не отвечает", desc: "Напиши слово вручную", tone: "pink" }); } });
    if (!rec) { onToast({ title: "Браузер не умеет слушать", desc: "Напиши слово вручную", tone: "pink" }); return; }
    recRef.current = rec; setListening(true); setInterim("");
  };
  return (<div className="text-center"><div className="flex justify-center"><button onClick={toggleMic} aria-label="Говорить в микрофон" className={`btn-arcade relative w-24 h-24 rounded-full border-4 flex items-center justify-center ${listening ? "bg-hot border-[#ff9bae] text-white shadow-[0_0_40px_rgba(255,84,112,0.8)]" : "bg-gradient-to-br from-[#ff2ec4] to-[#8b5cf6] border-[#ff9be4] text-white shadow-[0_0_30px_rgba(255,46,196,0.6)]"} ${listening ? "anim-pulse-glow" : ""}`}><IconMic className="w-10 h-10" />{listening && <span className="absolute inset-0 rounded-full border-4 border-hot animate-ping opacity-40" />}</button></div><div className="mt-4 h-8">{listening ? <span className="text-neon font-extrabold text-sm anim-pop inline-block">{interim ? `Слышу: "${interim}"` : "Слушаю... говори!"}</span> : !sttSupported && <span className="text-white/40 font-bold text-xs">Микрофон недоступен - напиши слово ниже</span>}</div><div className="flex gap-2 max-w-xs mx-auto mt-2"><input value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === "Enter" && typed.trim() && finish(speechMatches(word.en, typed), typed.trim())} placeholder="...или напиши слово" className="flex-1 bg-panel border-2 border-edge rounded-xl px-4 py-2.5 font-extrabold text-white placeholder:text-white/30 outline-none focus:border-neon transition-colors" /><NeonButton tone="cyan" onClick={() => typed.trim() && finish(speechMatches(word.en, typed), typed.trim())} disabled={!typed.trim()}>ОК</NeonButton></div><button onClick={() => speak(word.en, { rate, gender: gender ?? "default" })} className="mt-4 text-xs font-extrabold text-white/50 hover:text-neon transition-colors inline-flex items-center gap-1.5 underline underline-offset-4"><IconSpeaker className="w-3.5 h-3.5" /> Прослушать ещё раз</button></div>);
}

function StatChip({ label, value, tone }: { label: string; value: string; tone: string }) { return (<div className="bg-panel border-2 border-edge rounded-xl px-3 py-3"><div className={`font-display text-xl ${tone}`}>{value}</div><div className="text-[10px] font-extrabold uppercase tracking-widest text-white/45 mt-0.5">{label}</div></div>); }
function WordChip({ word, tone, rate, gender }: { word: Word; tone: "lime" | "pink"; rate: number; gender?: "male" | "female" | "default" }) { return (<button onClick={() => speak(word.en, { rate, gender: gender ?? "default" })} className={`btn-arcade inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 font-extrabold text-sm ${tone === "lime" ? "border-limey/60 bg-limey/10 text-limey" : "border-hot/60 bg-hot/10 text-hot"}`}><IconSpeaker className="w-3.5 h-3.5" />{word.en} <span className="text-white/50 font-bold text-xs">- {word.ru}</span></button>); }
