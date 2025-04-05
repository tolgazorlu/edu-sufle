"use client";
import { useOCAuth } from "@opencampus/ocid-connect-js";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

const LogoutButton = () => {
  const { ocAuth } = useOCAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Clear survey completion status from local storage
      localStorage.removeItem("surveyCompleted");
      localStorage.removeItem("surveyData");
      
      // Log out from OCID
      await ocAuth.signOut();
      
      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Button 
      onClick={handleLogout} 
      variant="outline" 
      className="bg-white hover:bg-gray-100 text-primary border-primary"
    >
      Logout
    </Button>
  );
};

export default LogoutButton; 