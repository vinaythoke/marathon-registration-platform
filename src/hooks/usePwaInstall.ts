"use client";

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(false); // Default to online (false)
  const [isInstallable, setIsInstallable] = useState(false);
  
  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('Service Worker registered successfully:', registration);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);
  
  // Listen for online/offline events
  useEffect(() => {
    // Check initial online status
    const checkOnlineStatus = () => {
      // Use navigator.onLine as the primary check
      const isCurrentlyOffline = !navigator.onLine;
      
      // Only update state if there's a change to prevent unnecessary renders
      if (isOffline !== isCurrentlyOffline) {
        setIsOffline(isCurrentlyOffline);
      }
    };
    
    // Check immediately on mount
    checkOnlineStatus();
    
    // Set up event listeners
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    
    // Check every 30 seconds as a fallback
    const intervalId = setInterval(checkOnlineStatus, 30000);
    
    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
      clearInterval(intervalId);
    };
  }, [isOffline]);
  
  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Update UI to show install button
      setIsInstallable(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Listen for app installed event
  useEffect(() => {
    const handleAppInstalled = () => {
      // Clear the prompt reference
      setInstallPrompt(null);
      // Hide install UI
      setIsInstallable(false);
      // Set installed flag
      setIsInstalled(true);
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  // Trigger PWA installation prompt
  const promptInstall = async () => {
    if (!installPrompt) {
      return;
    }
    
    // Show the prompt
    await installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    // Reset the deferred prompt variable
    setInstallPrompt(null);
    
    // Hide the install button
    setIsInstallable(choiceResult.outcome !== 'accepted');
    setIsInstalled(choiceResult.outcome === 'accepted');
  };
  
  return {
    isInstallable,
    isInstalled,
    isOffline,
    promptInstall
  };
} 