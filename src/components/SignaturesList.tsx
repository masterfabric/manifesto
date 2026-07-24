'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useSignatures } from '@/hooks/useSignatures';
import { type Signature } from '@/lib/types';

const AnimatedCounter = ({ target }: { target: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [target]);

  return <span className="text-3xl font-bold text-manifesto-gray">{count}</span>;
};

const SignatureCard = ({ signature }: { signature: Signature }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const github = (signature.profiles?.github_username || '').replace(/^@/, '') || 'unknown';
  const fullName = signature.profiles?.full_name || 'Unknown User';
  const avatar =
    signature.profiles?.avatar_url ||
    (github !== 'unknown'
      ? `https://avatars.githubusercontent.com/${encodeURIComponent(github)}`
      : 'https://avatars.githubusercontent.com/u/0?v=4');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-lg">
      <div className="mb-3 flex items-center space-x-3">
        <img
          src={avatar}
          alt={fullName}
          className="h-12 w-12 rounded-full border-2 border-gray-100 object-cover bg-gray-100"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold text-manifesto-gray">{fullName}</h4>
          <p className="truncate text-sm text-gray-500">@{github}</p>
        </div>
      </div>

      {signature.message ? (
        <p className="mb-3 rounded-md border-l-4 border-blue-200 bg-gray-50 p-3 text-sm italic text-gray-700">
          &ldquo;{signature.message}&rdquo;
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-xs text-gray-500">
        {signature.location ? (
          <span className="flex min-w-0 items-center space-x-1">
            <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="truncate">{signature.location}</span>
          </span>
        ) : (
          <span />
        )}
        <span className="shrink-0">{formatDate(signature.signed_at)}</span>
      </div>
    </div>
  );
};

export const SignaturesList = forwardRef<{ refetch: () => void }>((props, ref) => {
  const { signatures, loading, error, refetch } = useSignatures();

  useImperativeHandle(ref, () => ({ refetch }));

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div className="mb-12 rounded-lg border border-red-200 bg-red-50 p-6 text-center" role="alert">
        <h3 className="mb-2 text-lg font-semibold text-red-700">Error Loading Signatures</h3>
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 text-sm font-medium underline underline-offset-2"
          tabIndex={0}
          aria-label="Retry loading signatures"
        >
          Retry
        </button>
      </div>
    );
  }

  if (signatures.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 space-y-8">
      <div className="text-center">
        <h3 className="mb-2 text-2xl font-bold text-manifesto-gray">
          <AnimatedCounter target={signatures.length} />
        </h3>
        <p className="mb-1 text-lg text-gray-600">
          {signatures.length === 1 ? 'Signature' : 'Signatures'}
        </p>
        <p className="text-sm text-gray-500">
          Join developers who have committed to these principles
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {signatures.map((signature) => (
          <SignatureCard key={signature.id} signature={signature} />
        ))}
      </div>
    </div>
  );
});

SignaturesList.displayName = 'SignaturesList';
