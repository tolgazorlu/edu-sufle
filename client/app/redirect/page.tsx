"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOCAuth } from "@opencampus/ocid-connect-js";

const RedirectPage = () => {
  const router = useRouter();
  const { authState, ocAuth } = useOCAuth();

  useEffect(() => {
    const loginSuccess = () => {
      router.push("/app");
    };

    const loginError = () => {
      router.push("/"); 
    };

    const handleAuth = async () => {
      try {
        await ocAuth.handleLoginRedirect();
        loginSuccess();
      } catch (error) {
        loginError();
      }
    };

    handleAuth();
  }, [ocAuth, router]);

  if (authState?.error) {
    return <div>Error Logging in: {authState.error.message}</div>;
  }

  return <div>Loading...</div>;
};

export default RedirectPage;