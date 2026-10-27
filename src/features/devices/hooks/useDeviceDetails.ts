import { useEffect, useState } from "react";

import { getDeviceDetails } from "../api";
import type { DeviceDetails } from "../types";

/** Android version / battery for the selected device (fetched once per selection). */
export function useDeviceDetails(serial: string | null) {
  const [details, setDetails] = useState<DeviceDetails | null>(null);

  useEffect(() => {
    setDetails(null);
    if (!serial) return;

    let cancelled = false;
    getDeviceDetails(serial)
      .then((d) => !cancelled && setDetails(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [serial]);

  return details;
}
