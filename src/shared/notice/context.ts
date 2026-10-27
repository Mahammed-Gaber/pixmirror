import { createContext } from "react";

export type NoticeTone = "info" | "success" | "error";

export type NoticeAction = {
  label: string;
  run: () => void;
};

export type Notice = {
  id: number;
  tone: NoticeTone;
  text: string;
  action?: NoticeAction;
};

export type NoticeInput = Omit<Notice, "id">;

export type NoticeContextValue = {
  notice: Notice | null;
  notify: (input: NoticeInput) => void;
  notifyError: (error: unknown) => void;
  dismiss: () => void;
};

export const NoticeContext = createContext<NoticeContextValue | null>(null);
