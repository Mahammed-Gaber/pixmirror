import { useState } from "react";

import { useInterval } from "./useInterval";

/** Current timestamp, refreshed every `interval` ms while `enabled`. */
export function useNow(enabled: boolean, interval = 500) {
  const [now, setNow] = useState(() => Date.now());
  useInterval(() => setNow(Date.now()), enabled ? interval : null);
  return now;
}
