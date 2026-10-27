import { call } from "@/shared/lib/invoke";

/** Resolves with the saved PNG path. Works without mirroring. */
export const takeScreenshot = (serial: string) => call<string>("take_screenshot", { serial });

/** Restarts scrcpy with recording enabled; resolves with the target MP4 path. */
export const startRecording = () => call<string>("start_recording");

/** Finalizes the MP4 and resumes plain mirroring; resolves with the saved path. */
export const stopRecording = () => call<string>("stop_recording");

/** Opens Explorer with the file selected (must be inside the save directory). */
export const revealCapture = (path: string) => call<void>("reveal_capture", { path });
