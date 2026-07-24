'use client';

import { useState, useEffect, useRef } from 'react';
import { checkUserHasSigned } from '@/hooks/useSignatures';
import type { ManifestoUser } from '@/lib/types';
import {
  clearSession,
  getStoredUser,
  notifySessionChange,
  sessionEventName,
} from '@/lib/mf-session';

interface GitHubAuthProps {
  onAuthChange?: (user: ManifestoUser | null) => void;
  onShowUserDialog?: (user: ManifestoUser) => void;
}

export const GitHubAuth = ({ onAuthChange, onShowUserDialog }: GitHubAuthProps) => {
  const [user, setUser] = useState<ManifestoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const onAuthChangeRef = useRef(onAuthChange);
  const onShowUserDialogRef = useRef(onShowUserDialog);
  onAuthChangeRef.current = onAuthChange;
  onShowUserDialogRef.current = onShowUserDialog;

  useEffect(() => {
    let cancelled = false;

    const applyUser = async (next: ManifestoUser | null, showDialog = false) => {
      if (cancelled) return;
      setUser(next);
      onAuthChangeRef.current?.(next);
      if (!next) return;
      try {
        const hasSigned = await checkUserHasSigned(next.id);
        if (
          showDialog &&
          !hasSigned &&
          !localStorage.getItem('user_dialog_shown')
        ) {
          localStorage.setItem('user_dialog_shown', 'true');
          onShowUserDialogRef.current?.(next);
        }
      } catch {
        /* ignore */
      }
    };

    const hydrate = async () => {
      await applyUser(getStoredUser());
      if (!cancelled) setLoading(false);
    };
    hydrate();

    const onSession = () => {
      applyUser(getStoredUser());
    };
    window.addEventListener(sessionEventName, onSession);
    return () => {
      cancelled = true;
      window.removeEventListener(sessionEventName, onSession);
    };
  }, []);

  const handleSignOut = () => {
    clearSession();
    notifySessionChange();
    setUser(null);
    onAuthChange?.(null);
  };

  const handleGitHubSignIn = () => {
    setAuthError(null);
    window.location.href = '/api/auth/github';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-2" aria-busy="true">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-manifesto-gray" />
      </div>
    );
  }

  if (user) {
    const name = user.user_metadata?.full_name || user.user_metadata?.name || 'User';
    const handle =
      user.user_metadata?.preferred_username || user.user_metadata?.user_name || 'username';
    return (
      <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2">
        <img
          src={user.user_metadata?.avatar_url || 'https://avatars.githubusercontent.com/u/0?v=4'}
          alt={name}
          className="h-9 w-9 rounded-full border border-gray-100"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-manifesto-gray">{name}</p>
          <p className="truncate text-xs text-gray-500">@{handle}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="shrink-0 rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          tabIndex={0}
          aria-label="Sign out"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-center">
      <div>
        <h3 className="text-base font-semibold text-manifesto-gray">Sign the manifesto</h3>
        <p className="mt-1 text-sm text-gray-600">
          Use GitHub — your profile and optional comment are saved with your signature.
        </p>
      </div>

      {authError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-left text-sm text-red-800" role="alert">
          {authError}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleGitHubSignIn}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border-2 border-blue-800 bg-white px-4 py-2.5 text-sm font-medium text-blue-800 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2"
        tabIndex={0}
        aria-label="Sign in with GitHub"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path
            fillRule="evenodd"
            d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Sign in with GitHub</span>
      </button>
    </div>
  );
};
