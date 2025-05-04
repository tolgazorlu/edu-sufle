"use client";

import { useState } from "react";
import { useGoogleApi } from "../hooks/useGoogleApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export function GoogleAiExample() {
  const [prompt, setPrompt] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { 
    isReady,
    hasApiKey, 
    isLoading, 
    error: apiError, 
    callGoogleAi,
    sendToSettings
  } = useGoogleApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    // Clear previous response and errors
    setResponse("");
    setLocalError(null);
    
    try {
      // Example request to Google Gemini API
      const result = await callGoogleAi<GeminiResponse>({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });
      
      if (!result) {
        throw new Error("No response received from the API");
      }
      
      // Extract the response text from the Gemini API response
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error("Unexpected API response format");
      }
      
      setResponse(responseText);
    } catch (err: any) {
      // Handle API errors
      console.error("Error calling Google AI API:", err);
      
      let errorMessage = "An error occurred while generating the response.";
      
      // Try to extract specific error information
      if (err.message) {
        if (err.message.includes("model not found") || 
            err.message.includes("NOT_FOUND")) {
          errorMessage = "The AI model specified in the request was not found. The API might have been updated.";
          
          toast({
            title: "API Compatibility Issue",
            description: "There seems to be a compatibility issue with the Google AI API. Please contact support.",
            variant: "destructive",
          });
        } else {
          errorMessage = err.message;
        }
      }
      
      setLocalError(errorMessage);
      setResponse("Error: Unable to generate response. Please try again or check your API key.");
    }
  };

  // Show a message if the API key is not set
  if (isReady && !hasApiKey) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Google AI Example</CardTitle>
          <CardDescription>
            Try out Google's Gemini 1.5 Flash capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Google API key is not set. You need to set your API key to use this feature.
            </AlertDescription>
          </Alert>
          <Button onClick={sendToSettings}>
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Google AI Example</CardTitle>
        <CardDescription>
          Try out Google's Gemini 1.5 Flash capabilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium">
              Your prompt
            </label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={4}
              className="w-full resize-none"
            />
          </div>
          
          {(apiError || localError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{localError || apiError}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            type="submit" 
            disabled={isLoading || !prompt.trim()}
            className="w-full"
          >
            {isLoading ? "Generating..." : "Generate Response"}
          </Button>
          
          {response && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium">Response:</h3>
              <div className="rounded-md bg-muted p-4 whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 