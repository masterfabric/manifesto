'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Signature } from '@/lib/types';
import { getAccessToken } from '@/lib/mf-session';

/** Stable helper — safe to call from effects without putting the hook fn in deps. */
export const checkUserHasSigned = async (userId: string): Promise<boolean> => {
  try {
    const token = getAccessToken();
    if (!token) return false;
    const res = await fetch('/api/me/signature', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    return Boolean(res.ok && json.ok && json.signature);
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
      const res = await fetch('/api/signatures?limit=100');
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setSignatures(Array.isArray(json) ? json : []);
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

      const res = await fetch('/api/signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          location,
          privacy_consent: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setSignatures((prev) => [json as Signature, ...prev]);
      return json as Signature;
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
