import { useEffect, useState } from "react";

import { getAdbVersion } from "../api";

/** "Android Debug Bridge version 1.0.41" → "adb 1.0.41" */
function shorten(version: string) {
  const match = version.match(/version\s+([\d.]+)/i);
  return match ? `adb ${match[1]}` : version;
}

export function useAdbVersion() {
  const [version, setVersion] = useState("");

  useEffect(() => {
    getAdbVersion()
      .then((v) => setVersion(shorten(v)))
      .catch(() => setVersion(""));
  }, []);

  return version;
}
