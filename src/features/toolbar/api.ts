import { call } from "@/shared/lib/invoke";

/** Shrinks the main window into the toolbar docked beside the scrcpy window. */
export const enterToolbarMode = () => call<void>("enter_toolbar_mode");

/** Restores the main window's previous size and position. */
export const exitToolbarMode = () => call<void>("exit_toolbar_mode");

/** Minimize scrcpy + the docked toolbar to the taskbar together. */
export const minimizeMirrorSession = () => call<void>("minimize_mirror_session");
