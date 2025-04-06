"use client";

import LoginButton from "@/components/LoginButton";
import { Button } from "@/components/ui/button";
import { useOCAuth } from "@opencampus/ocid-connect-js";

export default function LandingPage() {
  const {authState} = useOCAuth();
  return (
    <div className="flex flex-col items-center justify-center h-screen">
        {authState.isAuthenticated ? (
            <Button onClick={() => {
                window.location.href = "/dashboard";
            }}>
                Go to Dashboard
            </Button>
        ) : (
            <LoginButton></LoginButton>
        )}
    </div>
  )
}
