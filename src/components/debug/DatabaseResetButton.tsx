"use client";

import { useState } from 'react';
import { resetDatabase } from '@/lib/offline/db';
import { useToast } from '@/components/ui/use-toast';

export const DatabaseResetButton = () => {
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    if (isResetting) return;
    
    const confirmed = window.confirm(
      "This will delete your local IndexedDB database. All offline data will be lost. Continue?"
    );
    
    if (!confirmed) return;
    
    try {
      setIsResetting(true);
      await resetDatabase();
      
      toast({
        title: "Database Reset",
        description: "IndexedDB database has been cleared. Page will refresh.",
      });
      
      // Wait a moment before refreshing
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Failed to reset database:", error);
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "There was an error resetting the database.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleReset}
        disabled={isResetting}
        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded shadow-lg text-sm flex items-center"
      >
        {isResetting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Resetting...
          </>
        ) : (
          <>Reset IndexedDB</>
        )}
      </button>
    </div>
  );
}; 