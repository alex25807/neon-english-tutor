export const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

let voices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  if (!ttsSupported) return;
  voices = window.speechSynthesis.getVoices();
}

if (ttsSupported) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoice(lang: string, gender: "male" | "female" | "default" = "default"): SpeechSynthesisVoice | null {
  const prefix = lang.slice(0, 2).toLowerCase();
  const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  if (langVoices.length === 0) return null;

  const googleVoices = langVoices.filter((v) => /google/i.test(v.name));
  const microsoftVoices = langVoices.filter((v) => /microsoft/i.test(v.name));
  const pool = googleVoices.length > 0 ? googleVoices :
               microsoftVoices.length > 0 ? microsoftVoices :
               langVoices;

  if (gender === "default") {
    if (lang === "en-US") {
      const usVoice = pool.find((v) => v.lang === "en-US");
      if (usVoice) return usVoice;
    }
    return pool[0];
  }

  const maleKeywords = ["male", "man", "david", "mark", "daniel", "james", "alex", "fred", "tom", "george", "rishi", "guy"];
  const femaleKeywords = ["female", "woman", "zira", "susan", "samantha", "karen", "victoria", "fiona", "moira", "tessa", "linda", "kate"];

  const keywords = gender === "male" ? maleKeywords : femaleKeywords;
  const match = pool.find((v) => keywords.some((k) => v.name.toLowerCase().includes(k)));

  if (!match && pool.length > 1) {
    return gender === "male" ? pool[0] : pool[Math.min(1, pool.length - 1)];
  }

  return match || pool[0];
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function stopSpeaking() {
  if (!ttsSupported) return;
  activeUtterance = null;
  try { window.speechSynthesis.cancel(); } catch { /* noop */ }
}

export function speak(
  text: string,
  opts: { lang?: string; rate?: number; gender?: "male" | "female" | "default"; volume?: number } = {}
): Promise<void> {
  return new Promise((resolve) => {
    if (!ttsSupported || !text) { resolve(); return; }
    const lang = opts.lang ?? "en-US";
    const gender = opts.gender ?? "default";
    try {
      window.speechSynthesis.cancel();

      let processedText = text;
      if (lang.startsWith("en")) {
        processedText = text.replace(/\./g, "... ").replace(/,/g, ",, ");
      }

      const u = new SpeechSynthesisUtterance(processedText);
      u.lang = lang;
      const v = pickVoice(lang, gender);
      if (v) u.voice = v;
      u.rate = opts.rate ?? 0.85;
      u.pitch = lang.startsWith("en") ? 1.0 : 1.05;
      u.volume = opts.volume ?? 1.0;
      activeUtterance = u;
      const done = () => {
        if (activeUtterance === u) activeUtterance = null;
        resolve();
      };
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.speak(u);
      window.setTimeout(done, Math.max(4000, processedText.length * 160));
    } catch { resolve(); }
  });
}

type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
};

function getSR(): (new () => SR) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition as new () => SR) || (w.webkitSpeechRecognition as new () => SR) || null;
}

export const sttSupported = !!getSR();

export function startListening(opts: {
  lang: "en-US" | "ru-RU";
  onFinal: (text: string) => void;
  onInterim?: (text: string) => void;
  onEnd: () => void;
  onError?: (err: string) => void;
}): { stop: () => void } | null {
  const Ctor = getSR();
  if (!Ctor) return null;
  let rec: SR;
  try { rec = new Ctor(); } catch { return null; }
  rec.lang = opts.lang;
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 3;
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) opts.onFinal(r[0].transcript);
      else interim += r[0].transcript;
    }
    if (interim && opts.onInterim) opts.onInterim(interim);
  };
  rec.onend = () => opts.onEnd();
  rec.onerror = (e) => opts.onError?.(e.error ?? "unknown");
  try { rec.start(); } catch { return null; }
  return {
    stop: () => {
      try { rec.stop(); } catch { /* noop */ }
    },
  };
}

export function normalizeSpoken(s: string): string {
  return s.toLowerCase().replace(/[^a-zа-яё\s]/gi, "").replace(/\s+/g, " ").trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)] as number[]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

export function speechMatches(target: string, heard: string): boolean {
  const t = normalizeSpoken(target);
  const h = normalizeSpoken(heard);
  if (!t || !h) return false;
  if (t === h) return true;
  if (h.includes(t) || (t.length > 3 && t.includes(h))) return true;
  const words = h.split(" ");
  if (words.some((w) => w === t)) return true;
  const tolerance = Math.max(1, Math.ceil(t.length * 0.34));
  if (levenshtein(t, h) <= tolerance) return true;
  return words.some((w) => levenshtein(t, w) <= tolerance);
}
