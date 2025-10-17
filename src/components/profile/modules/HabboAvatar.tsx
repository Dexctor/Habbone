"use client";

const HABBO_BASE = process.env.NEXT_PUBLIC_HABBO_BASE || 'https://www.habbo.fr';

export type HabboAvatarProps = {
  nick: string;
  size?: 's' | 'm' | 'l';
  className?: string;
};

export function HabboAvatar({ nick, size = 'm', className }: HabboAvatarProps) {
  const src = `${HABBO_BASE}/habbo-imaging/avatarimage?user=${encodeURIComponent(
    nick
  )}&direction=2&head_direction=3&img_format=png&size=${size}`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={nick} className={className ?? "w-10 h-10 rounded"} />;
}

export function HabboHeadOnly({ nick, size = 's', className }: HabboAvatarProps) {
  const src = `${HABBO_BASE}/habbo-imaging/avatarimage?user=${encodeURIComponent(
    nick || ''
  )}&direction=2&head_direction=3&img_format=png&size=${size}&headonly=1`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={nick} className={className ?? "w-12 h-12 rounded"} />;
}

