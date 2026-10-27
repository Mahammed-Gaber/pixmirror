import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";
import { LanguageProvider } from "./shared/i18n";
import "./shared/i18n/i18n";
import { NoticeProvider } from "./shared/notice";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <LanguageProvider>
      <NoticeProvider>
        <App />
      </NoticeProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
