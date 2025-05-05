"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function GoogleApiSettings() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  // In a real app, you would get the userId from your auth system
  const mockUserId = "current-user-id";

  useEffect(() => {
    // Load the API key on component mount
    const fetchApiKey = async () => {
      try {
        // First check localStorage as a fallback
        const savedApiKey = localStorage.getItem("googleApiKey");
        if (savedApiKey) {
          setApiKey(savedApiKey);
        }
        
        // Then try to get from the server
        const response = await fetch(`/api/settings?userId=${mockUserId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.googleApiKey) {
            setApiKey(data.googleApiKey);
            // Update localStorage for offline access
            localStorage.setItem("googleApiKey", data.googleApiKey);
          }
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
      }
    };

    fetchApiKey();
  }, []);

  const testApiKey = async (key: string) => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/genai/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mockUserId,
          payload: {
            contents: [
              {
                parts: [
                  { text: "Respond with 'API key is working correctly' to verify connectivity." }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: 50,
              temperature: 0.1,
            }
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API key test failed:", errorData);
        
        // Check if the error contains model-specific issues
        if (errorData.details && typeof errorData.details === 'string') {
          let errorMessage = errorData.details;
          try {
            // Try to parse it as JSON if it's a string representation of JSON
            const detailsObj = JSON.parse(errorData.details);
            if (detailsObj.error && detailsObj.error.message) {
              errorMessage = detailsObj.error.message;
              if (detailsObj.error.message.includes('is not found') || 
                  detailsObj.error.message.includes('NOT_FOUND')) {
                throw new Error("Model not found. The API endpoint might need to be updated.");
              }
            }
          } catch (e) {
            // If it's not valid JSON, use the string as is
            throw new Error(errorMessage);
          }
        }
        throw new Error(errorData.error || 'Failed to test Google AI API');
      }
      
      const data = await response.json();
      
      // Check if we got a valid response from the API
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        setTestResult({
          success: true,
          message: "API key is valid and working!"
        });
        return true;
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error";
      console.error("API key test error:", errorMessage);
      
      setTestResult({
        success: false,
        message: `API key test failed: ${errorMessage}`
      });
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveApiKey = async () => {
    setIsLoading(true);
    try {
      // Test the API key before saving
      const testSuccess = await testApiKey(apiKey);
      
      if (!testSuccess) {
        throw new Error("The API key validation failed. Please check the key and try again.");
      }
      
      // Only save if the test was successful
      // Save to localStorage for offline access
      localStorage.setItem("googleApiKey", apiKey);
      
      // Save to the server
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleApiKey: apiKey, userId: mockUserId }),
      });

      if (!response.ok) {
        throw new Error("Failed to save API key to server");
      }
      
      toast({
        title: "API Key Saved",
        description: "Your Google API key has been saved and verified successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save API key. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving API key:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearApiKey = async () => {
    setIsLoading(true);
    try {
      // Clear from localStorage
      localStorage.removeItem("googleApiKey");
      
      // Clear from the server
      const response = await fetch(`/api/settings?userId=${mockUserId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete API key from server");
      }

      setApiKey("");
      setTestResult(null);
      
      toast({
        title: "API Key Cleared",
        description: "Your Google API key has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear API key. Please try again.",
        variant: "destructive",
      });
      console.error("Error clearing API key:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Google API Settings</CardTitle>
        <CardDescription>
          Add your Google API key to enable enhanced AI features across Sufle.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              Google API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google API key"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored securely and used only for requests to Google services.
            </p>
          </div>
          
          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"} className="mt-2">
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleClearApiKey}
              disabled={!apiKey || isLoading || isTesting}
            >
              {isLoading ? "Clearing..." : "Clear Key"}
            </Button>
            <Button 
              onClick={handleSaveApiKey}
              disabled={!apiKey || isLoading || isTesting}
            >
              {isLoading ? "Saving..." : isTesting ? "Testing..." : "Save & Test Key"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 