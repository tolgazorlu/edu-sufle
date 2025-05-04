"use client";

import { useState, useEffect } from "react";
import { getGoogleApiKey, hasGoogleApiKey } from "../utils/google-api";

interface UseGoogleApiOptions {
  redirectToSettings?: boolean;
}

interface UseGoogleApiReturn {
  isReady: boolean;
  hasApiKey: boolean;
  isLoading: boolean;
  error: string | null;
  callGoogleAi: <T>(payload: any) => Promise<T | null>;
  sendToSettings: () => void;
}

export function useGoogleApi(options: UseGoogleApiOptions = {}): UseGoogleApiReturn {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check for API key on mount
  useEffect(() => {
    const checkApiKey = () => {
      const hasKey = hasGoogleApiKey();
      setHasApiKey(hasKey);
      setIsReady(true);
      
      // Redirect to settings if option is enabled and no key is present
      if (options.redirectToSettings && !hasKey && typeof window !== 'undefined') {
        window.location.href = '/app/settings';
      }
    };
    
    checkApiKey();
  }, [options.redirectToSettings]);

  // Function to call Google's Generative AI API
  const callGoogleAi = async <T>(payload: any): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use our server-side proxy to make the request
      const response = await fetch('/api/genai/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'current-user-id', // In a real app, get this from auth
          payload,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to call Google AI API');
      }
      
      const data = await response.json();
      return data as T;
    } catch (error: any) {
      setError(error.message || 'An error occurred while calling the Google AI API');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to navigate to settings
  const sendToSettings = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/app/settings';
    }
  };

  return {
    isReady,
    hasApiKey,
    isLoading,
    error,
    callGoogleAi,
    sendToSettings,
  };
} 