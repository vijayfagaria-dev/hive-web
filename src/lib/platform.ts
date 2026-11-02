"use client";

import { useEffect, useState } from "react";

/** iPhone/iPad (iPadOS reports itself as a Mac, so also check for touch). iOS can't open
 *  Android `intent://` links — callers swap those for a web or universal link. */
export const isIOSDevice = () =>
  typeof navigator !== "undefined" &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

/** `isIOSDevice()` read once after mount, so server and first client render agree. */
export function useIsIOS() {
  const [ios, setIos] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- detect the client platform once after mount (avoids an SSR hydration mismatch)
  useEffect(() => setIos(isIOSDevice()), []);
  return ios;
}
