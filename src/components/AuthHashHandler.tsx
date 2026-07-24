'use client';

import { useEffect, useRef } from 'react';
import { checkUserHasSigned } from '@/hooks/useSignatures';
import type { ManifestoUser, MfGoUser } from '@/lib/types';
import { mapMfUser, notifySessionChange, setSession } from '@/lib/mf-session';

interface AuthHashHandlerProps {
  onShowUserDialog?: (user: ManifestoUser) => void;
}

export const AuthHashHandler = ({ onShowUserDialog }: AuthHashHandlerProps) => {
  const onShowUserDialogRef = useRef(onShowUserDialog);
  onShowUserDialogRef.current = onShowUserDialog;

  useEffect(() => {
    const handleAuthHash = async () => {
      if (typeof window === 'undefined' || !window.location.hash) return;

      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (!accessToken) return;

      const refreshToken = hashParams.get('refresh_token');
      const userId = hashParams.get('user_id');
      const email = hashParams.get('email');
      const displayName = hashParams.get('display_name');
      const avatarUrl = hashParams.get('avatar_url');
      const socialGitHub = hashParams.get('social_github');

      if (!userId || !email) return;

      // Clear hash immediately so remounts / Strict Mode do not re-process.
      window.history.replaceState(null, '', window.location.pathname);

      let mfUser: MfGoUser = {
        id: userId,
        email,
        displayName: displayName || null,
        avatarURL: avatarUrl || null,
        socialGitHub: socialGitHub || null,
      };

      try {
        const res = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();
        if (res.ok && json?.user) {
          mfUser = {
            id: json.user.id || mfUser.id,
            email: json.user.email || mfUser.email,
            displayName: json.user.displayName ?? mfUser.displayName,
            avatarURL: json.user.avatarURL ?? mfUser.avatarURL,
            socialGitHub: json.user.socialGitHub ?? mfUser.socialGitHub,
          };
        }
      } catch {
        /* keep hash user */
      }

      setSession({
        accessToken,
        refreshToken,
        user: mfUser,
      });
      notifySessionChange();

      const user = mapMfUser(mfUser);
      try {
        const hasSigned = await checkUserHasSigned(user.id);
        if (!hasSigned) {
          onShowUserDialogRef.current?.(user);
        }
      } catch {
        onShowUserDialogRef.current?.(user);
      }
    };

    handleAuthHash();
  }, []);

  return null;
};
