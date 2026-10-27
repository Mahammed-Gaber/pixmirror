import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";
import { useNotice } from "@/shared/notice";
import { getSaveDirectory, openSaveDirectory, setSaveDirectory, type CaptureFolder } from "../api";

export function useSaveDirectory() {
  const [directory, setDirectory] = useState("");
  const { notify, notifyError } = useNotice();
  const { t } = useTranslation();

  useEffect(() => {
    getSaveDirectory().then(setDirectory).catch(notifyError);
  }, [notifyError]);

  async function choose() {
    const picked = await open({
      directory: true,
      multiple: false,
      title: t("settings.pickSaveDir"),
    });
    if (typeof picked !== "string") return;
    try {
      setDirectory(await setSaveDirectory(picked));
      notify({ tone: "info", text: t("settings.saveDirChanged") });
    } catch (error) {
      notifyError(error);
    }
  }

  function reveal(kind?: CaptureFolder) {
    openSaveDirectory(kind).catch(notifyError);
  }

  return { directory, choose, reveal };
}
