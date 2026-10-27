import { call } from "@/shared/lib/invoke";
import type { MirrorOptions, MirrorStatus } from "./types";

export const startMirroring = (options: MirrorOptions) => call<void>("start_mirroring", { options });

/** Resolves with the recording path if a recording was in progress. */
export const stopMirroring = () => call<string | null>("stop_mirroring");

export const getMirrorStatus = () => call<MirrorStatus>("get_mirror_status");
