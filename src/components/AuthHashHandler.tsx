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
        const { fetchMe } = await import('@/lib/mf-data');
        const me = await fetchMe(accessToken);
        mfUser = {
          id: me.id || mfUser.id,
          email: me.email || mfUser.email,
          displayName: me.displayName ?? mfUser.displayName,
          avatarURL: me.avatarURL ?? mfUser.avatarURL,
          socialGitHub: me.socialGitHub ?? mfUser.socialGitHub,
        };
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
