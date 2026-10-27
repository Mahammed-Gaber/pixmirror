import { invoke, type InvokeArgs } from "@tauri-apps/api/core";

import { toMessage } from "../utils/errors";

/** `invoke` that always rejects with an `Error` carrying the backend message. */
export async function call<T>(command: string, args?: InvokeArgs): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw new Error(toMessage(error));
  }
}
