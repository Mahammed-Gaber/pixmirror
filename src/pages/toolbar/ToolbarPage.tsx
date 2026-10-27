import { useCaptureNotice, useRecording, useScreenshot } from "@/features/capture";
import { sendKey, type DeviceKey } from "@/features/devices";
import type { MirrorSession } from "@/features/mirroring";
import { useSaveDirectory } from "@/features/settings";
import { MirrorToolbar, useFlash } from "@/features/toolbar";
import { minimizeMirrorSession } from "@/features/toolbar/api";
import { useNotice } from "@/shared/notice";

export function ToolbarPage({ session }: { session: MirrorSession }) {
  const { status } = session;
  const serial = status.serial ?? "";

  const screenshot = useScreenshot();
  const recording = useRecording({ recording: status.recording, refresh: session.refresh });
  const saveDirectory = useSaveDirectory();
  const { saved: announceSaved } = useCaptureNotice();
  const { notifyError } = useNotice();
  const flash = useFlash();

  async function takeScreenshot() {
    flash.show("screenshot", await screenshot.take(serial));
  }

  async function toggleRecording() {
    const ok = await recording.toggle();
    if (!ok) flash.show("record", false);
  }

  function pressKey(key: DeviceKey) {
    sendKey(serial, key).catch(notifyError);
  }

  async function stop() {
    const recordingPath = await session.stop();
    if (recordingPath) announceSaved("recording", recordingPath);
  }

  function minimize() {
    minimizeMirrorSession().catch(notifyError);
  }

  return (
    <MirrorToolbar
      recording={status.recording}
      recordingStartedAt={status.recordingStartedAt}
      busy={{
        screenshot: screenshot.busy,
        record: recording.busy,
        stop: session.pending === "stop",
      }}
      toneFor={flash.toneFor}
      onScreenshot={() => void takeScreenshot()}
      onToggleRecord={() => void toggleRecording()}
      onKey={pressKey}
      onOpenFolder={() => saveDirectory.reveal()}
      onMinimize={minimize}
      onStop={() => void stop()}
    />
  );
}
