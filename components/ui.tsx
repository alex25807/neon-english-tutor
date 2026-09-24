import { useMemo, type ReactNode } from "react";
import type { Toast } from "../game/types";
import { IconBolt, IconSparkle, IconStar, IconTrophy, IconX } from "./icons";

export type Tone = "cyan" | "pink" | "lime" | "gold" | "violet" | "dark";

const TONES: Record<Tone, string> = {
  cyan: "bg-neon text-[#04252b] border-[#8ffbff] shadow-[0_5px_0_#0891b2,0_0_20px_rgba(0,229,255,0.35)]",
  pink: "bg-pinky text-white border-[#ff9be4] shadow-[0_5px_0_#a1127a,0_0_20px_rgba(255,46,196,0.4)]",
  lime: "bg-limey text-[#132502] border-[#d3ff8a] shadow-[0_5px_0_#4d7c0f,0_0_20px_rgba(163,255,18,0.35)]",
  gold: "bg-goldy text-[#2b2002] border-[#ffe97a] shadow-[0_5px_0_#b45309,0_0_20px_rgba(255,214,10,0.35)]",
  violet: "bg-viol text-white border-[#c4b0ff] shadow-[0_5px_0_#5b21b6,0_0_20px_rgba(139,92,246,0.45)]",
  dark: "bg-panel2 text-white border-edge shadow-[0_5px_0_#0d0730] hover:border-neon/60",
};

export function NeonButton({ tone = "cyan", size = "md", className = "", children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "px-3 py-1.5 text-xs rounded-lg" : size === "lg" ? "px-7 py-3.5 text-base rounded-xl" : "px-5 py-2.5 text-sm rounded-xl";
  return (<button {...rest} className={`btn-arcade font-display uppercase tracking-wider inline-flex items-center justify-center gap-2 border-2 ${sz} ${TONES[tone]} disabled:opacity-40 disabled:pointer-events-none ${className}`}>{children}</button>);
}

export function Bar({ value, tone = "cyan", className = "", h = "h-3" }: { value: number; tone?: Tone; className?: string; h?: string }) {
  const bg: Record<Tone, string> = { cyan: "bg-neon shadow-[0_0_10px_rgba(0,229,255,0.8)]", pink: "bg-pinky shadow-[0_0_10px_rgba(255,46,196,0.8)]", lime: "bg-limey shadow-[0_0_10px_rgba(163,255,18,0.8)]", gold: "bg-goldy shadow-[0_0_10px_rgba(255,214,10,0.8)]", violet: "bg-viol shadow-[0_0_10px_rgba(139,92,246,0.8)]", dark: "bg-panel2" };
  return (<div className={`w-full ${h} rounded-full bg-[#0d0730] border border-edge overflow-hidden ${className}`}><div className={`${h} rounded-full transition-all duration-500 ease-out ${bg[tone]}`} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} /></div>);
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (<button onClick={onClick} className={`btn-arcade px-3.5 py-1.5 rounded-full text-xs font-extrabold border-2 transition-colors ${active ? "bg-neon text-[#04252b] border-[#8ffbff] shadow-[0_0_14px_rgba(0,229,255,0.5)]" : "bg-panel text-white/70 border-edge hover:border-neon/50 hover:text-white"}`}>{children}</button>);
}

export function StarRow({ n, size = "w-10 h-10", animate }: { n: number; size?: string; animate?: boolean }) {
  return (<div className="flex gap-2 justify-center">{[0, 1, 2].map((i) => (<span key={i} className={animate && i < n ? "anim-pop" : ""} style={animate && i < n ? { animationDelay: `${0.25 + i * 0.28}s` } : undefined}><IconStar className={`${size} ${i < n ? "text-goldy drop-shadow-[0_0_10px_rgba(255,214,10,0.8)]" : "text-white/15"}`} /></span>))}</div>);
}

export function Modal({ open, onClose, children, wide }: { open: boolean; onClose: () => void; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-[#05020f]/80 backdrop-blur-sm" onClick={onClose} /><div className={`anim-pop relative w-full ${wide ? "max-w-2xl" : "max-w-md"} bg-deep border-2 border-edge rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.35)] p-6 max-h-[86vh] overflow-y-auto`}><button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-panel2 border-2 border-edge text-white/60 hover:text-hot hover:border-hot/60 flex items-center justify-center btn-arcade" aria-label="Закрыть"><IconX className="w-4 h-4" /></button>{children}</div></div>);
}

const CONFETTI_COLORS = ["#00e5ff", "#ff2ec4", "#a3ff12", "#ffd60a", "#8b5cf6", "#ffffff"];

export function Confetti({ count = 40 }: { count?: number }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({ id: i, left: Math.random() * 100, delay: Math.random() * 0.8, dur: 2.4 + Math.random() * 2, size: 6 + Math.random() * 8, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], round: Math.random() > 0.5 })), [count]);
  return (<div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">{pieces.map((p) => (<span key={p.id} className="absolute top-0" style={{ left: `${p.left}%`, width: p.size, height: p.size * (p.round ? 1 : 0.45), background: p.color, borderRadius: p.round ? "50%" : "2px", boxShadow: `0 0 8px ${p.color}`, animation: `confettiFall ${p.dur}s ${p.delay}s linear forwards` }} />))}</div>);
}

export function ToastHost({ toasts }: { toasts: Toast[] }) {
  const toneCls: Record<Toast["tone"], string> = { gold: "border-goldy/70 text-goldy", cyan: "border-neon/70 text-neon", pink: "border-pinky/70 text-pinky", lime: "border-limey/70 text-limey" };
  const icons: Record<Toast["tone"], ReactNode> = { gold: <IconTrophy className="w-6 h-6" />, cyan: <IconSparkle className="w-6 h-6" />, pink: <IconBolt className="w-6 h-6" />, lime: <IconStar className="w-6 h-6" /> };
  return (<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none w-full max-w-sm px-4">{toasts.map((t) => (<div key={t.id} className={`anim-toast w-full bg-deep/95 border-2 rounded-xl px-4 py-3 flex items-center gap-3 shadow-[0_0_24px_rgba(0,0,0,0.5)] ${toneCls[t.tone]}`}>{icons[t.tone]}<div className="min-w-0"><div className="font-display text-sm uppercase tracking-wide">{t.title}</div>{t.desc && <div className="text-xs text-white/70 font-semibold truncate">{t.desc}</div>}</div></div>))}</div>);
}
