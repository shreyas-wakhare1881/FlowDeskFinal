'use client';

import { useState, useEffect, useMemo } from 'react';
import { authService, type AuthUser } from '@/lib/auth.service';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  shortName: string;   // "Shreyas W."
}

function deriveNameFromEmail(email: string): string {
  const local = email.split('@')[0];
  // shreyaswakhare → Shreyas Wakhare  (split on uppercase or common separators)
  const parts = local
    .replace(/[._\-+]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
  return parts.join(' ') || 'User';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getShortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function useCurrentUser(): CurrentUser {
  // Start with null so server and client both render the same fallback on first
  // paint — this prevents the hydration mismatch where SSR has no localStorage.
  // After mount, swap in the real value from localStorage.
  const [raw, setRaw] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Runs only on the client, after hydration
    setRaw(authService.getUser());

    // Keep in sync when the user logs in/out in another tab or on the same tab
    const sync = () => setRaw(authService.getUser());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  return useMemo(() => {
    if (!raw) {
      return { id: '', name: 'User', email: '', initials: 'U', shortName: 'User' };
    }
    const name = raw.name?.trim() || deriveNameFromEmail(raw.email);
    return {
      id: raw.id,
      name,
      email: raw.email,
      initials: getInitials(name),
      shortName: getShortName(name),
    };
  }, [raw]);
}
