import { useId } from "react";

type P = { className?: string };
const S = (props: P & { children: React.ReactNode; vb?: string; fill?: boolean }) => (
  <svg viewBox={props.vb ?? "0 0 24 24"} className={props.className ?? "w-5 h-5"} fill={props.fill ? "currentColor" : "none"} stroke={props.fill ? "none" : "currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{props.children}</svg>
);

export const IconSpeaker = (p: P) => (<S {...p}><path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9.5 9.5 0 0 1 0 13" /></S>);
export const IconMic = (p: P) => (<S {...p}><rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" stroke="none" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3.5" /></S>);
export const IconStar = (p: P & { off?: boolean }) => (<S {...p} fill><path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 16.9 6.3 20l1.2-6.3L2.8 9.3l6.4-.8L12 2.6z" opacity={p.off ? 0.22 : 1} /></S>);
export const IconHeart = (p: P & { off?: boolean }) => (<S {...p} fill><path d="M12 21s-7.5-4.7-10-9.3C.4 8.6 2.3 4.9 5.8 4.4c2.2-.3 4.2.8 6.2 3.2 2-2.4 4-3.5 6.2-3.2 3.5.5 5.4 4.2 3.8 7.3C19.5 16.3 12 21 12 21z" opacity={p.off ? 0.18 : 1} /></S>);
export const IconBolt = (p: P) => (<S {...p} fill><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2z" /></S>);
export const IconLock = (p: P) => (<S {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="currentColor" stroke="none" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" /></S>);
export const IconFlame = (p: P) => (<S {...p} fill><path d="M12 2c1 4-3 5.5-3 9a3 3 0 0 0 6 .2C16.8 12.6 18 14.6 18 17a6 6 0 0 1-12 0c0-5 4.5-7.5 6-15z" /></S>);
export const IconGear = (p: P) => (<S {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" /></S>);
export const IconPlay = (p: P) => (<S {...p} fill><path d="M7 4.5v15l13-7.5-13-7.5z" /></S>);
export const IconCheck = (p: P) => (<S {...p}><path d="M4 12.5l5 5L20 6.5" strokeWidth={3} /></S>);
export const IconX = (p: P) => (<S {...p}><path d="M6 6l12 12M18 6L6 18" strokeWidth={3} /></S>);
export const IconRocket = (p: P) => (<S {...p} fill><path d="M12 2c4 2.5 6 6.5 6 11l-2.5 2.5h-7L6 13c0-4.5 2-8.5 6-11z" /><circle cx="12" cy="9.5" r="2" fill="#0a0522" /><path d="M8.5 16 6 21l4-2M15.5 16 18 21l-4-2" stroke="currentColor" strokeWidth="2" fill="none" /></S>);
export const IconBook = (p: P) => (<S {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" /><path d="M9 8h7" /></S>);
export const IconTrophy = (p: P) => (<S {...p} fill><path d="M6 3h12v2h3v3a5 5 0 0 1-4.5 5A6 6 0 0 1 13 16.9V19h3v2H8v-2h3v-2.1A6 6 0 0 1 7.5 13 5 5 0 0 1 3 8V5h3V3zm-1 4v1a3 3 0 0 0 1.6 2.6A9.6 9.6 0 0 1 6 7H5zm14 0h-1c0 1.3-.2 2.5-.6 3.6A3 3 0 0 0 19 8V7z" /></S>);
export const IconChat = (p: P) => (<S {...p} fill><path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.6 1.4 4.9 3.6 6.4L4.5 21l4-1.8c1.1.3 2.3.5 3.5.5 5.5 0 10-3.8 10-8.2S17.5 3 12 3z" /></S>);
export const IconMap = (p: P) => (<S {...p}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></S>);
export const IconRefresh = (p: P) => (<S {...p}><path d="M20 11A8 8 0 1 0 18.4 16" /><path d="M20 4v7h-7" /></S>);
export const IconArrowRight = (p: P) => (<S {...p}><path d="M4 12h15M13 5.5 19.5 12 13 18.5" strokeWidth={2.6} /></S>);
export const IconSend = (p: P) => (<S {...p} fill><path d="M3 11.5 21 3l-6.5 18-3.2-7.3L3 11.5z" /></S>);
export const IconSparkle = (p: P) => (<S {...p} fill><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2z" /></S>);
export const IconPortal = (p: P) => (<S {...p}><ellipse cx="12" cy="12" rx="9" ry="9" /><ellipse cx="12" cy="12" rx="5.5" ry="9" transform="rotate(35 12 12)" /><ellipse cx="12" cy="12" rx="5.5" ry="9" transform="rotate(-35 12 12)" /></S>);
export const IconBoss = (p: P) => (<S {...p} fill><path d="M12 2a8 8 0 0 0-8 8v6l3 2v3l3-1.5L12 21l2-1.5L17 21v-3l3-2v-6a8 8 0 0 0-8-8z" /><circle cx="8.7" cy="10" r="1.9" fill="#0a0522" /><circle cx="15.3" cy="10" r="1.9" fill="#0a0522" /><path d="M8.5 15h7l-1.2 2h-4.6L8.5 15z" fill="#0a0522" /></S>);

export function VoltRobot({ mood = "happy", className }: { mood?: "happy" | "sad" | "wow" | "cool"; className?: string }) {
  const id = useId().replace(/[:]/g, "");
  return (
    <svg viewBox="0 0 120 120" className={className ?? "w-16 h-16"} aria-hidden="true">
      <defs><linearGradient id={`vh-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b2a86" /><stop offset="1" stopColor="#241464" /></linearGradient></defs>
      <g className="anim-antenna"><line x1="60" y1="14" x2="60" y2="26" stroke="#00e5ff" strokeWidth="3" /><circle cx="60" cy="11" r="5" fill="#00e5ff" /></g>
      <rect x="22" y="26" width="76" height="58" rx="16" fill={`url(#vh-${id})`} stroke="#00e5ff" strokeWidth="2.5" />
      <rect x="12" y="46" width="10" height="18" rx="4" fill="#372383" stroke="#ff2ec4" strokeWidth="2" />
      <rect x="98" y="46" width="10" height="18" rx="4" fill="#372383" stroke="#ff2ec4" strokeWidth="2" />
      <rect x="32" y="38" width="56" height="32" rx="10" fill="#0a0522" stroke="#372383" strokeWidth="2" />
      {mood === "happy" && <g><circle cx="47" cy="53" r="6" fill="#00e5ff" /><circle cx="73" cy="53" r="6" fill="#00e5ff" /><path d="M48 64q12 8 24 0" stroke="#a3ff12" strokeWidth="3.5" fill="none" strokeLinecap="round" /></g>}
      {mood === "sad" && <g><circle cx="47" cy="55" r="6" fill="#4d7cff" /><circle cx="73" cy="55" r="6" fill="#4d7cff" /><path d="M48 68q12 -8 24 0" stroke="#ff5470" strokeWidth="3.5" fill="none" strokeLinecap="round" /></g>}
      {mood === "wow" && <g><circle cx="47" cy="53" r="7" fill="none" stroke="#ffd60a" strokeWidth="3.5" /><circle cx="73" cy="53" r="7" fill="none" stroke="#ffd60a" strokeWidth="3.5" /><ellipse cx="60" cy="66" rx="5" ry="4" fill="#ffd60a" /></g>}
      {mood === "cool" && <g><rect x="36" y="47" width="48" height="11" rx="5.5" fill="#ff2ec4" opacity="0.9" /><path d="M48 65q12 7 24 0" stroke="#00e5ff" strokeWidth="3.5" fill="none" strokeLinecap="round" /></g>}
      <rect x="36" y="86" width="48" height="24" rx="10" fill={`url(#vh-${id})`} stroke="#ff2ec4" strokeWidth="2.5" />
      <circle cx="60" cy="98" r="6" fill="#ffd60a" className="anim-antenna" />
    </svg>
  );
}

export function PlayerAvatar({ idx, className }: { idx: number; className?: string }) {
  const cls = className ?? "w-10 h-10";
  if (idx === 0) return (<svg viewBox="0 0 64 64" className={cls} aria-hidden="true"><rect x="14" y="10" width="36" height="30" rx="9" fill="#241464" stroke="#00e5ff" strokeWidth="2.5" /><circle cx="32" cy="6" r="3" fill="#ffd60a" /><line x1="32" y1="9" x2="32" y2="10" stroke="#ffd60a" strokeWidth="2" /><circle cx="25" cy="24" r="4" fill="#a3ff12" /><circle cx="39" cy="24" r="4" fill="#a3ff12" /><path d="M26 33q6 4 12 0" stroke="#ff2ec4" strokeWidth="2.5" fill="none" strokeLinecap="round" /><rect x="20" y="44" width="24" height="14" rx="6" fill="#241464" stroke="#00e5ff" strokeWidth="2.5" /></svg>);
  if (idx === 1) return (<svg viewBox="0 0 64 64" className={cls} aria-hidden="true"><path d="M16 18 10 6l14 6z" fill="#ff9f0a" /><path d="M48 18 54 6l-14 6z" fill="#ff9f0a" /><circle cx="32" cy="34" r="22" fill="#ffd60a" /><circle cx="24" cy="30" r="3.4" fill="#0a0522" /><circle cx="40" cy="30" r="3.4" fill="#0a0522" /><path d="M27 42q5 4 10 0" stroke="#0a0522" strokeWidth="2.5" fill="none" strokeLinecap="round" /><path d="M29 37h6l-3 4z" fill="#0a0522" /></svg>);
  if (idx === 2) return (<svg viewBox="0 0 64 64" className={cls} aria-hidden="true"><path d="M32 4 26 16h12L32 4z" fill="#a3ff12" /><circle cx="32" cy="36" r="22" fill="#22c55e" /><circle cx="24" cy="32" r="4" fill="#ffd60a" /><circle cx="40" cy="32" r="4" fill="#ffd60a" /><circle cx="24" cy="32" r="1.8" fill="#0a0522" /><circle cx="40" cy="32" r="1.8" fill="#0a0522" /><path d="M25 45q7 5 14 0" stroke="#0a0522" strokeWidth="2.5" fill="none" strokeLinecap="round" /><path d="M46 20l8-6-4 10z" fill="#a3ff12" /></svg>);
  if (idx === 3) return (<svg viewBox="0 0 64 64" className={cls} aria-hidden="true"><circle cx="32" cy="34" r="24" fill="#241464" stroke="#8b5cf6" strokeWidth="2.5" /><circle cx="32" cy="30" r="16" fill="#0a0522" stroke="#00e5ff" strokeWidth="2" /><circle cx="26" cy="28" r="3" fill="#00e5ff" /><circle cx="38" cy="28" r="3" fill="#00e5ff" /><path d="M27 35q5 3 10 0" stroke="#ff2ec4" strokeWidth="2.2" fill="none" strokeLinecap="round" /><rect x="24" y="52" width="16" height="8" rx="4" fill="#8b5cf6" /></svg>);
  return (
    <svg viewBox="0 0 64 64" className={cls} aria-hidden="true">
      <circle cx="32" cy="32" r="26" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
      <path d="M32 6 L32 58 M6 32 L58 32 M14 14 L50 50 M50 14 L14 50" stroke="#7f1d1d" strokeWidth="1" opacity="0.6" />
      <path d="M18 28 Q22 20 28 28 Q22 32 18 28 Z" fill="white" stroke="#0a0522" strokeWidth="1.5" />
      <path d="M36 28 Q42 20 46 28 Q42 32 36 28 Z" fill="white" stroke="#0a0522" strokeWidth="1.5" />
    </svg>
  );
}

export function Planet({ hue, hue2, ring, className, seed = 1 }: { hue: string; hue2: string; ring?: boolean; className?: string; seed?: number }) {
  const id = useId().replace(/[:]/g, "");
  return (
    <svg viewBox="0 0 100 100" className={className ?? "w-20 h-20"} aria-hidden="true">
      <defs><radialGradient id={`pg-${id}`} cx="0.35" cy="0.3" r="0.9"><stop offset="0" stopColor={hue} /><stop offset="1" stopColor={hue2} /></radialGradient></defs>
      {ring && <ellipse cx="50" cy="52" rx="46" ry="14" fill="none" stroke={hue} strokeWidth="3" opacity="0.7" transform={`rotate(${-16 + seed * 4} 50 50)`} />}
      <circle cx="50" cy="50" r="30" fill={`url(#pg-${id})`} />
      <circle cx="40" cy="42" r="5" fill="#0a0522" opacity="0.25" />
      <circle cx="60" cy="58" r="7" fill="#0a0522" opacity="0.2" />
      <circle cx="55" cy="38" r="3" fill="#ffffff" opacity="0.5" />
      {ring && <path d="M20 60a46 14 -16 0 0 60 -4" fill="none" stroke={hue} strokeWidth="3" opacity="0.9" transform={`rotate(${-16 + seed * 4} 50 50)`} />}
    </svg>
  );
}
