// components/MixpanelInitializer.tsx
"use client";

import { useEffect } from "react";
import { initMixpanel } from "../lib/mixpanel"; // Adjust path as needed

export default function ClientMixpanelInitializer() {
  useEffect(() => {
    initMixpanel();
  }, []);

  return null;
}
