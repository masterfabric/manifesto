'use client';

import { useState, useEffect } from 'react';
import { useSignatures, checkUserHasSigned } from '@/hooks/useSignatures';
import type { ManifestoUser } from '@/lib/types';
import { getStoredUser, sessionEventName } from '@/lib/mf-session';

interface SignatureFormProps {
  onSignatureSuccess?: (userName: string) => void;
  onRefreshSignatures?: () => void;
  /** Opens privacy consent when the user tries to sign without it. */
  onNeedPrivacy?: () => void;
  /** Parent finished welcome/privacy — form fields are interactive. */
  readyToSign?: boolean;
}

export const SignatureForm = ({
  onSignatureSuccess,
  onRefreshSignatures,
  onNeedPrivacy,
  readyToSign = false,
}: SignatureFormProps = {}) => {
  const { addSignature } = useSignatures();
  const [user, setUser] = useState<ManifestoUser | null>(null);
  const [userHasSigned, setUserHasSigned] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    location: '',
    privacyConsent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const currentUser = getStoredUser();
      if (cancelled) return;
      setUser((prev) => {
        if (prev?.id === currentUser?.id) return prev;
        return currentUser;
      });
      if (currentUser) {
        const signed = await checkUserHasSigned(currentUser.id);
        if (!cancelled) setUserHasSigned(signed);
      } else if (!cancelled) {
        setUserHasSigned(false);
      }
    };
    sync();
    window.addEventListener(sessionEventName, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(sessionEventName, sync);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const privacyConsent = localStorage.getItem('privacy_consent') === 'true';
    if (!privacyConsent) {
      onNeedPrivacy?.();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addSignature(formData.message, formData.location, privacyConsent);
      if (result) {
        setFormData({ message: '', location: '', privacyConsent: false });
        setUserHasSigned(true);
        localStorage.setItem('user_dialog_shown', 'true');
        onRefreshSignatures?.();
        onSignatureSuccess?.(
          user.user_metadata?.full_name || user.user_metadata?.name || 'User',
        );
      } else {
        alert('There was an error signing the manifesto. Please try again.');
      }
    } catch (error) {
      console.error('Error signing manifesto:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'There was an error signing the manifesto. Please check your connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  if (userHasSigned) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="mb-4 flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-800">Thank you for signing!</h3>
        </div>
        <p className="text-green-700">
          Your signature has been added to the Developer Manifesto. Thank you for supporting these
          principles!
        </p>
      </div>
    );
  }

  if (!readyToSign) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center">
        <p className="text-sm text-gray-600">
          Continue from the welcome dialog to add your signature, or{' '}
          <button
            type="button"
            className="font-medium text-blue-800 underline underline-offset-2"
            onClick={() => onNeedPrivacy?.()}
            tabIndex={0}
            aria-label="Start signing the manifesto"
          >
            start signing
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6"
    >
      <div className="mb-4 flex items-center space-x-3">
        <img
          src={user.user_metadata?.avatar_url || 'https://avatars.githubusercontent.com/u/0?v=4'}
          alt={user.user_metadata?.full_name || 'User'}
          className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
        />
        <div>
          <h3 className="text-lg font-semibold text-manifesto-gray">
            Sign as {user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
          </h3>
          <p className="text-sm text-gray-500">
            @{user.user_metadata?.preferred_username || user.user_metadata?.user_name || 'username'}
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
          Location
        </label>
        <input
          type="text"
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="City, Country"
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
          Message (Optional)
        </label>
        <textarea
          id="message"
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Share why you're signing this manifesto..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md border-2 border-blue-800 bg-white px-4 py-3 font-medium text-blue-800 transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        tabIndex={0}
        aria-label="Sign the manifesto"
      >
        {isSubmitting ? 'Signing...' : 'Sign the Manifesto'}
      </button>
    </form>
  );
};
