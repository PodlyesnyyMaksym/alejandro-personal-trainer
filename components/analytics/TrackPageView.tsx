"use client";

import { useEffect } from "react";

import { sendPageViewOnce } from "@/lib/analytics";

export function TrackPageView() {
  useEffect(() => {
    sendPageViewOnce();
  }, []);

  return null;
}
