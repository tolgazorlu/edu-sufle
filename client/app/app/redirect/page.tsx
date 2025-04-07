"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOCAuth } from "@opencampus/ocid-connect-js";

const RedirectPage = () => {
  const router = useRouter();
  const { authState, ocAuth } = useOCAuth();
  const [isLoading, setIsLoading] = useState(true);

  const loginSuccess = async () => {
    try {
      // First check localStorage for backward compatibility
      const hasCompletedSurveyLocal = localStorage.getItem("surveyCompleted");
      
      if (hasCompletedSurveyLocal === "true") {
        router.push("/dashboard");
        return;
      }
      
      // If not found in localStorage, check the blockchain
      if (authState.idToken) {
        const decodedToken = JSON.parse(atob(authState.idToken.split('.')[1]));
        const userAddress = decodedToken.sub;
        
        // Call our API to check survey status on the blockchain
        const response = await fetch(`/api/survey/status?address=${userAddress}`);
        const data = await response.json();
        
        if (data.hasCompletedSurvey) {
          // Update localStorage for faster checks next time
          localStorage.setItem("surveyCompleted", "true");
          router.push("/dashboard");
        } else {
          // If survey not completed, redirect to the survey page
          router.push("/survey");
        }
      } else {
        // If no token is available, redirect to the survey as a fallback
        router.push("/survey");
      }
    } catch (error) {
      console.error("Error checking survey status:", error);
      // If there's an error checking status, default to the survey
      router.push("/survey");
    } finally {
      setIsLoading(false);
    }
  };

  const loginError = () => {
    setIsLoading(false);
    router.push("/"); // Redirect to login page or show error message
  };

  useEffect(() => {
    const handleAuth = async () => {
      try {
        await ocAuth.handleLoginRedirect();
        await loginSuccess();
      } catch (error) {
        loginError();
      }
    };

    handleAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocAuth]);

  if (authState.error) {
    return <div>Error Logging in: {authState.error.message}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mb-4"></div>
      <h2 className="text-xl font-medium text-gray-700">Authenticating...</h2>
    </div>
  );
};

export default RedirectPage;
