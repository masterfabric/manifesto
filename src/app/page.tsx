'use client';

import { useState, useEffect, useRef } from 'react';
import AbstractAnimation from '@/components/AbstractAnimation';
import { GitHubAuth } from '@/components/GitHubAuth';
import { SignatureForm } from '@/components/SignatureForm';
import { SignaturesList } from '@/components/SignaturesList';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { SignatureSuccessDialog } from '@/components/SignatureSuccessDialog';
import { AuthHashHandler } from '@/components/AuthHashHandler';
import { PrivacyConsentDialog } from '@/components/PrivacyConsentDialog';
import { PrivacyWarningBanner } from '@/components/PrivacyWarningBanner';
import { getStoredUser } from '@/lib/mf-session';

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    preferred_username?: string;
    user_name?: string;
  };
}

interface ManifestoContent {
  frontmatter: {
    title: string;
    author?: string;
    date: string;
  };
  content: string;
}

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 mt-24 pt-8 pb-12">
      <div className="max-w-4xl mx-auto px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Source Code:</span>
              <a
                href="https://github.com/gurkanfikretgunak/manifesto"
                className="ml-1 hover:text-gray-900 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Repository
              </a>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Owner:</span>
              <span className="ml-1">MasterFabric Developers</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <a
                href="https://masterfabric.co"
                className="font-semibold hover:text-gray-900 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                masterfabric.co
              </a>
            </div>
            <div className="text-sm text-gray-600">
              <a
                href="https://www.gurkanfikretgunak.com"
                className="font-semibold hover:text-gray-900 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                gurkanfikretgunak.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            <p>Built with Next.js, TailwindCSS, and Three.js</p>
            <p>Typography: JetBrains Mono</p>
            <div className="mt-4 pt-3 border-t border-gray-50">
              <p>© 2025 MasterFabric Developers. All rights reserved.</p>
              <p>Version v0.3.0</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function Home() {
  const [manifestoContent, setManifestoContent] = useState<ManifestoContent | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successUserName, setSuccessUserName] = useState('');
  const [showSignatureForm, setShowSignatureForm] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState<boolean | null>(null);
  const signaturesListRef = useRef<{ refetch: () => void }>(null);
  const signSectionRef = useRef<HTMLDivElement>(null);

  const scrollToSignForm = () => {
    window.setTimeout(() => {
      signSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const message = document.getElementById('message') as HTMLTextAreaElement | null;
      message?.focus({ preventScroll: true });
    }, 250);
  };

  useEffect(() => {
    const loadManifestoContent = async () => {
      try {
        const { fetchParticularDocument } = await import('@/lib/mf-data');
        const data = await fetchParticularDocument();
        if (data) {
          setManifestoContent(data);
          return;
        }
        setManifestoContent({
          frontmatter: {
            title: 'The Developer Manifesto',
            author: 'MasterFabric Developers',
            date: '2024',
          },
          content: '<p>Manifesto document not found.</p>',
        });
      } catch (error) {
        console.error('Error loading manifesto:', error);
        setManifestoContent({
          frontmatter: {
            title: 'The Developer Manifesto',
            author: 'MasterFabric Developers',
            date: '2024',
          },
          content: `<p class="text-red-700">Failed to load manifesto: ${
            error instanceof Error ? error.message : 'unknown error'
          }</p>`,
        });
      }
    };

    loadManifestoContent();
  }, []);

  const resumeSignFlowForUser = () => {
    const storedConsent = localStorage.getItem('privacy_consent');
    if (storedConsent === 'true') {
      setPrivacyConsent(true);
      setShowSignatureForm(true);
      scrollToSignForm();
      return;
    }
    if (storedConsent === 'false') {
      setPrivacyConsent(false);
      setShowPrivacyBanner(true);
      return;
    }
    setShowPrivacyDialog(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome') !== '1') return;
    window.history.replaceState(null, '', window.location.pathname);
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
      setShowUserDialog(true);
    }
  }, []);

  const handleAuthChange = (user: User | null) => {
    setCurrentUser(user);
    if (!user) {
      setShowSignatureForm(false);
      return;
    }
    if (localStorage.getItem('privacy_consent') === 'true') {
      setPrivacyConsent(true);
      setShowSignatureForm(true);
    }
  };

  const handleShowUserDialog = (_user: User) => {
    setShowUserDialog(true);
  };

  const handleCloseUserDialog = () => {
    setShowUserDialog(false);
  };

  const handleSignManifesto = () => {
    setShowUserDialog(false);
    resumeSignFlowForUser();
  };

  const handleSignatureSuccess = (userName: string) => {
    setSuccessUserName(userName);
    setShowSuccessDialog(true);
    setShowSignatureForm(true);
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    window.location.reload();
  };

  const handleRefreshSignatures = () => {
    signaturesListRef.current?.refetch();
  };

  const handlePrivacyAccept = () => {
    setPrivacyConsent(true);
    localStorage.setItem('privacy_consent', 'true');
    setShowPrivacyDialog(false);
    setShowSignatureForm(true);
    scrollToSignForm();
  };

  const handlePrivacyReject = () => {
    setPrivacyConsent(false);
    localStorage.setItem('privacy_consent', 'false');
    setShowPrivacyDialog(false);
    setShowPrivacyBanner(true);
  };

  const handlePrivacyRetry = () => {
    setShowPrivacyBanner(false);
    setShowPrivacyDialog(true);
  };

  const handlePrivacyBannerDismiss = () => {
    setShowPrivacyBanner(false);
  };

  if (!manifestoContent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-manifesto-gray"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      <AuthHashHandler onShowUserDialog={handleShowUserDialog} />

      <PrivacyWarningBanner
        isVisible={showPrivacyBanner}
        onRetry={handlePrivacyRetry}
        onDismiss={handlePrivacyBannerDismiss}
      />

      <AbstractAnimation />

      <main className="relative z-10 max-w-4xl mx-auto px-8 py-16">
        <header className="mb-16">
          <div className="mb-4">
            <span className="text-sm text-gray-500 uppercase tracking-wider">
              {manifestoContent.frontmatter.date}
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4">
            {manifestoContent.frontmatter.title}
          </h1>
          {manifestoContent.frontmatter.author && (
            <p className="text-lg text-gray-600">
              by {manifestoContent.frontmatter.author}
            </p>
          )}
        </header>

        <article
          className="prose prose-lg prose-gray max-w-none prose-headings:font-bold prose-headings:text-manifesto-gray prose-p:text-manifesto-gray prose-li:text-manifesto-gray prose-strong:text-manifesto-gray prose-a:text-manifesto-gray prose-a:underline prose-a:decoration-gray-400 prose-a:underline-offset-2 hover:prose-a:decoration-manifesto-gray transition-all duration-300"
          dangerouslySetInnerHTML={{ __html: manifestoContent.content }}
        />

        <section className="mt-24 pt-16 border-t border-gray-200">
          <div className="max-w-4xl mx-auto">
            <SignaturesList ref={signaturesListRef} />

            <div
              ref={signSectionRef}
              id="sign-manifesto-section"
              className="rounded-lg bg-gray-50 p-4 sm:p-5"
            >
              <div className="mx-auto max-w-md space-y-4">
                <GitHubAuth
                  onAuthChange={handleAuthChange}
                  onShowUserDialog={handleShowUserDialog}
                />
                {currentUser ? (
                  <SignatureForm
                    onSignatureSuccess={handleSignatureSuccess}
                    onRefreshSignatures={handleRefreshSignatures}
                    onNeedPrivacy={() => setShowPrivacyDialog(true)}
                    readyToSign={showSignatureForm || privacyConsent === true}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <UserProfileDialog
        user={currentUser}
        isOpen={showUserDialog}
        onClose={handleCloseUserDialog}
        onSignManifesto={handleSignManifesto}
      />

      <SignatureSuccessDialog
        isOpen={showSuccessDialog}
        onClose={handleCloseSuccessDialog}
        userName={successUserName}
      />

      <PrivacyConsentDialog
        user={currentUser}
        isOpen={showPrivacyDialog}
        onClose={() => setShowPrivacyDialog(false)}
        onAccept={handlePrivacyAccept}
        onReject={handlePrivacyReject}
      />
    </div>
  );
}
