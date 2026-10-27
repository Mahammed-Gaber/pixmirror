import { useContext } from "react";

import { NoticeContext } from "./context";

export function useNotice() {
  const value = useContext(NoticeContext);
  if (!value) throw new Error("useNotice must be used inside <NoticeProvider>");
  return value;
}
