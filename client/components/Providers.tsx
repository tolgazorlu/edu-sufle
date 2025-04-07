"use client";

import React, { useState, useEffect } from "react";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  // This ensures hydration issue doesn't cause problems
  useEffect(() => {
    setMounted(true);
  }, []);

  // Wait until mounted to render the children
  if (!mounted) {
    return null; // or return a loading spinner
  }

  return (
    <React.StrictMode>
      {children}
    </React.StrictMode>
  );
} 