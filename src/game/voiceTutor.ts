import { SENTENCES, WORDS } from "./content";
import { pronunciationScore } from "./speech";
import type { GameState } from "./types";

export interface SpeakPrompt {
  id: string;
  en: string;
  ru: string;
  hint: string;
}

export const SPEAK_SCRIPT: SpeakPrompt[] = [
  { id: "hello", en: "hello", ru: "привет", hint: "Поздоровайся с Вольтом" },
  { id: "how-are-you", en: "how are you", ru: "как дела", hint: "Спроси, как дела" },
  { id: "i-am-fine", en: "I am fine", ru: "я в порядке", hint: "Ответь, что всё хорошо" },
  { id: "thank-you", en: "thank you", ru: "спасибо", hint: "Поблагодари" },
  { id: "please", en: "please", ru: "пожалуйста", hint: "Вежливое словечко" },
  { id: "goodbye", en: "goodbye", ru: "пока", hint: "Попрощайся" },
  { id: "yes", en: "yes", ru: "да", hint: "Согласись" },
  { id: "no", en: "no", ru: "нет", hint: "Откажись вежливо" },
  { id: "nice-to-meet-you", en: "nice to meet you", ru: "приятно познакомиться", hint: "При знакомстве" },
  { id: "good-morning", en: "good morning", ru: "доброе утро", hint: "Утреннее приветствие" },
  { id: "i-was-at-home", en: "I was at home", ru: "я был дома", hint: "Скажи, где ты был вчера" },
  { id: "i-was-happy", en: "I was happy", ru: "я был счастлив", hint: "Назови чувство" },
  { id: "i-played-yesterday", en: "I played yesterday", ru: "я играл вчера", hint: "Past Simple: что делал" },
  { id: "i-went-to-the-park", en: "I went to the park", ru: "я ходил в парк", hint: "Нерегулярный глагол went" },
  { id: "i-am-going-to-swim", en: "I am going to swim", ru: "я собираюсь плавать", hint: "План на будущее" },
];

export function promptsFromProgress(state: GameState): SpeakPrompt[] {
  const seenWords = WORDS.filter((w) => state.cards[w.id]?.seen).map((w) => ({
    id: `word-${w.id}`,
    en: w.en,
    ru: w.ru,
    hint: `${w.emoji} Слово из словаря`,
  }));
  const sentences = SENTENCES.filter((s) => s.lvl <= Math.max(1, state.startLevel)).map((s) => ({
    id: `sent-${s.id}`,
    en: s.en,
    ru: s.ru,
    hint: "Целое предложение",
  }));
  return [...SPEAK_SCRIPT, ...seenWords, ...sentences];
}

export function nextSpeakPrompt(state: GameState, usedIds: string[]): SpeakPrompt {
  const all = promptsFromProgress(state);
  const unused = all.filter((p) => !usedIds.includes(p.id));
  const pool = unused.length ? unused : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? SPEAK_SCRIPT[0];
}

export function firstSpeakPrompt(state: GameState): SpeakPrompt {
  return promptsFromProgress(state)[0] ?? SPEAK_SCRIPT[0];
}

export function voiceFeedback(target: string, heard: string): { text: string; mood: "happy" | "wow" | "sad" | "cool"; stars: 0 | 1 | 2 | 3; ok: boolean } {
  const { stars, ok } = pronunciationScore(target, heard);
  if (stars === 3) return { stars, ok, mood: "wow", text: "Идеально! Произношение как у героя галактики!" };
  if (stars === 2) return { stars, ok, mood: "happy", text: `Почти идеально! Я услышал: «${heard}». Ещё чуть чётче — и будет супер.` };
  if (stars === 1) return { stars, ok, mood: "cool", text: `Почти! Я услышал: «${heard}». Послушай ещё раз и повтори: ${target}.` };
  return { stars, ok, mood: "sad", text: `Я услышал: «${heard || "…"}». А нужно сказать: ${target}. Давай ещё раз!` };
}
