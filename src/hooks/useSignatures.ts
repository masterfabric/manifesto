'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Signature } from '@/lib/types';
import { getAccessToken } from '@/lib/mf-session';
import {
  fetchMe,
  fetchMyParticularSignature,
  fetchParticularSignatures,
  normalizePublicProfile,
  signParticularManifesto,
} from '@/lib/mf-data';

/** Stable helper — safe to call from effects without putting the hook fn in deps. */
export const checkUserHasSigned = async (_userId: string): Promise<boolean> => {
  try {
    const token = getAccessToken();
    if (!token) return false;
    const signature = await fetchMyParticularSignature(token);
    return Boolean(signature);
  } catch {
    return false;
  }
};

export const useSignatures = () => {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignatures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchParticularSignatures(100);
      setSignatures(data.signatures);
    } catch (err) {
      console.error('Error fetching signatures:', err);
      setError(err instanceof Error ? err.message : 'Failed to load signatures');
      setSignatures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addSignature = useCallback(
    async (message?: string, location?: string, privacyConsent: boolean = true) => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Sign in required');
      }
      if (!privacyConsent) {
        throw new Error('Privacy consent is required');
      }

      const me = await fetchMe(token);
      const profile = normalizePublicProfile({
        githubUsername: me.socialGitHub,
        fullName: me.displayName,
        avatarUrl: me.avatarURL,
      });

      const signature = await signParticularManifesto(token, {
        githubUsername: profile.githubUsername,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        message,
        location,
        privacyConsent: true,
      });
      setSignatures((prev) => [signature, ...prev]);
      return signature;
    },
    [],
  );

  const hasUserSigned = useCallback(async (userId: string): Promise<boolean> => {
    if (await checkUserHasSigned(userId)) return true;
    return signatures.some((s) => s.user_id === userId);
  }, [signatures]);

  useEffect(() => {
    fetchSignatures();
  }, [fetchSignatures]);

  return {
    signatures,
    loading,
    error,
    addSignature,
    hasUserSigned,
    refetch: fetchSignatures,
  };
};
