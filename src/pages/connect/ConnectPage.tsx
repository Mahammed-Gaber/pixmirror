import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useScreenshot } from "@/features/capture";
import {
  ConnectGuide,
  countReadyPhones,
  DeviceHeader,
  DeviceSidebar,
  deviceName,
  useAdbVersion,
  useDeviceDetails,
  useDeviceStats,
  useDevices,
} from "@/features/devices";
import { PresetPicker, useDevicePrefs, type MirrorSession } from "@/features/mirroring";
import { SettingsDialog, useSaveDirectory } from "@/features/settings";
import { Button } from "@/shared/components/Button";
import { Switch } from "@/shared/components/Switch";
import { StatusBar } from "./StatusBar";

export function ConnectPage({ session }: { session: MirrorSession }) {
  const { t } = useTranslation();
  const devices = useDevices(true);
  const selected = devices.selected;
  const details = useDeviceDetails(selected?.serial ?? null);
  const deviceStats = useDeviceStats(selected?.serial ?? null, Boolean(selected));
  const adbVersion = useAdbVersion();
  const saveDirectory = useSaveDirectory();
  const screenshot = useScreenshot();
  const { preset, setPreset, screenOff, setScreenOff } = useDevicePrefs(selected);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const starting = session.pending === "start";
  const phoneCount = useMemo(
    () => countReadyPhones([...devices.ready, ...devices.pending]),
    [devices.ready, devices.pending],
  );
  const batteryLevel = deviceStats.stats?.batteryLevel ?? details?.batteryLevel ?? null;
  const batteryCharging = deviceStats.stats?.batteryStatus === "charging";

  function startMirroring() {
    if (!selected) return;
    void session.start({
      serial: selected.serial,
      preset,
      turnScreenOff: screenOff,
      stayAwake: true,
      windowTitle: deviceName(selected) || t("devices.androidDevice"),
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        <DeviceSidebar
          ready={devices.ready}
          pending={devices.pending}
          selectedSerial={selected?.serial ?? null}
          onSelect={devices.select}
          onRefresh={() => void devices.refresh()}
        />

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-10 py-9">
          {!devices.loaded ? null : selected ? (
            <>
              <DeviceHeader
                device={selected}
                details={details}
                stats={deviceStats.stats}
                statsError={deviceStats.error}
              />

              <div className="mt-9 grid max-w-115 gap-6">
                <PresetPicker value={preset} onChange={setPreset} disabled={starting} />
                <Switch
                  checked={screenOff}
                  onChange={setScreenOff}
                  disabled={starting}
                  label={t("connect.screenOff")}
                  hint={t("connect.screenOffHint")}
                />
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-8">
                <Button
                  variant="primary"
                  size="lg"
                  icon="play"
                  onClick={startMirroring}
                  disabled={starting}
                >
                  {starting ? t("connect.starting") : t("connect.start")}
                </Button>
                <Button
                  size="lg"
                  icon="camera"
                  disabled={screenshot.busy}
                  onClick={() => void screenshot.take(selected.serial)}
                >
                  {t("connect.screenshot")}
                </Button>
              </div>
            </>
          ) : (
            <ConnectGuide pending={devices.pending} error={devices.error} />
          )}
        </main>
      </div>

      <StatusBar
        phoneCount={phoneCount}
        batteryLevel={selected ? batteryLevel : null}
        batteryCharging={selected ? batteryCharging : false}
        adbVersion={adbVersion}
        saveDirectory={saveDirectory.directory}
        onOpenSaveDirectory={() => saveDirectory.reveal()}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        saveDirectory={saveDirectory.directory}
        onChooseDirectory={() => void saveDirectory.choose()}
        onOpenDirectory={() => saveDirectory.reveal()}
        adbVersion={adbVersion}
      />
    </div>
  );
}
