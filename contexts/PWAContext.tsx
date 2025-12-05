'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface PWAContextType {
  deferredPrompt: any;
  isInstallable: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  triggerInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  clearPrompt: () => void;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect platform
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /Android/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Check if running as standalone PWA
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Check if we already have a captured prompt from the global script
    if ((window as any).deferredPrompt) {
      console.log('PWAContext: Found existing deferred prompt from global script');
      setDeferredPrompt((window as any).deferredPrompt);
      setIsInstallable(true);
    }

    // Listen for new beforeinstallprompt events
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('PWAContext: beforeinstallprompt event captured');
      setDeferredPrompt(e);
      setIsInstallable(true);
      // Also store globally for persistence
      (window as any).deferredPrompt = e;
    };

    // Listen for successful app installation
    const handleAppInstalled = () => {
      console.log('PWAContext: App was installed');
      setDeferredPrompt(null);
      setIsInstallable(false);
      (window as any).deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    // Check both local state and global window object
    const prompt = deferredPrompt || (typeof window !== 'undefined' ? (window as any).deferredPrompt : null);

    if (!prompt) {
      console.log('PWAContext: No install prompt available');
      return 'unavailable';
    }

    try {
      console.log('PWAContext: Triggering install prompt');
      prompt.prompt();
      const choiceResult = await prompt.userChoice;

      // Clear the prompt after use (can only be used once)
      setDeferredPrompt(null);
      setIsInstallable(false);
      if (typeof window !== 'undefined') {
        (window as any).deferredPrompt = null;
      }

      if (choiceResult.outcome === 'accepted') {
        console.log('PWAContext: User accepted the install prompt');
        return 'accepted';
      } else {
        console.log('PWAContext: User dismissed the install prompt');
        return 'dismissed';
      }
    } catch (error) {
      console.error('PWAContext: Error triggering install prompt:', error);
      return 'unavailable';
    }
  }, [deferredPrompt]);

  const clearPrompt = useCallback(() => {
    setDeferredPrompt(null);
    setIsInstallable(false);
    if (typeof window !== 'undefined') {
      (window as any).deferredPrompt = null;
    }
  }, []);

  return (
    <PWAContext.Provider
      value={{
        deferredPrompt,
        isInstallable,
        isIOS,
        isAndroid,
        isStandalone,
        triggerInstall,
        clearPrompt,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}
