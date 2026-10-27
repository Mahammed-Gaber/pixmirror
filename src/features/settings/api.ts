import { call } from "@/shared/lib/invoke";

export type CaptureFolder = "screenshots" | "recordings";

export const getSaveDirectory = () => call<string>("get_save_directory");

export const setSaveDirectory = (path: string) => call<string>("set_save_directory", { path });

export const openSaveDirectory = (kind?: CaptureFolder) =>
  call<void>("open_save_directory", { kind: kind ?? null });
