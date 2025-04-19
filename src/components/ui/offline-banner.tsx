"use client";

import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useState, useEffect } from "react";
import { AlertCircle, WifiOff, Download } from "lucide-react";
import { Button } from "./button";
import { Alert, AlertTitle, AlertDescription } from "./alert";

export function OfflineBanner() {
  const [mounted, setMounted] = useState(false);
  const [confirmedOffline, setConfirmedOffline] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  
  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Only access browser APIs after component is mounted
  const { isOffline, isInstallable, promptInstall } = usePwaInstall();
  
  // Show installation banner after a delay if the app is installable
  useEffect(() => {
    if (!mounted) return;
    
    if (isInstallable) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 3000); // Show after 3 seconds
      
      return () => clearTimeout(timer);
    } else {
      setShowInstallBanner(false);
    }
  }, [isInstallable, mounted]);
  
  // Debounce offline status to prevent flashing
  useEffect(() => {
    if (!mounted) return;
    
    let timeoutId: NodeJS.Timeout;
    
    if (isOffline) {
      // When going offline, wait a moment to confirm it's not a momentary blip
      timeoutId = setTimeout(() => {
        setConfirmedOffline(true);
      }, 2000);
    } else {
      // When going online, clear the offline state immediately
      setConfirmedOffline(false);
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOffline, mounted]);
  
  // Additional network connectivity check
  useEffect(() => {
    if (!mounted) return;
    
    const checkConnectivity = async () => {
      try {
        // Try to fetch a tiny resource to verify actual connectivity
        // This helps in cases where navigator.onLine might report incorrectly
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch('/api/ping', { 
          method: 'HEAD',
          signal: controller.signal,
          // Prevent caching
          headers: { 'Cache-Control': 'no-cache, no-store' }
        });
        
        clearTimeout(timeoutId);
        setConfirmedOffline(false);
      } catch (error) {
        // If fetch fails, we're likely offline
        if (isOffline) {
          setConfirmedOffline(true);
        }
      }
    };
    
    // Only run the fetch check if isOffline is true
    if (isOffline) {
      checkConnectivity();
    }
  }, [isOffline, mounted]);
  
  // Don't render anything during SSR or initial mount to prevent hydration issues
  if (!mounted) {
    return null;
  }
  
  if (!confirmedOffline && !showInstallBanner) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      {confirmedOffline && (
        <Alert variant="destructive" className="mb-2">
          <WifiOff className="h-4 w-4 mr-2" />
          <AlertTitle>You are offline</AlertTitle>
          <AlertDescription>
            Limited functionality is available. Some actions will be queued until you're back online.
          </AlertDescription>
        </Alert>
      )}
      
      {showInstallBanner && !confirmedOffline && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Download className="h-4 w-4 mr-2 text-blue-600" />
          <div className="flex-1">
            <AlertTitle>Install App</AlertTitle>
            <AlertDescription>
              Install this app on your device for a better experience and offline access.
            </AlertDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowInstallBanner(false)}
            >
              Dismiss
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={promptInstall}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Install
            </Button>
          </div>
        </Alert>
      )}
    </div>
  );
} 