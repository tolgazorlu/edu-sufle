"use client";
import { useOCAuth } from "@opencampus/ocid-connect-js";
import OCButton from "./OCButton";

const LoginButton = () => {
  const { ocAuth } = useOCAuth();

  const handleLogin = async () => {
    await ocAuth.signInWithRedirect({
      state: "opencampus",
    });
  };

  return (
    <OCButton className="z-50" onClick={handleLogin}>
      Connect OCID
    </OCButton>
  );
};

export default LoginButton;
