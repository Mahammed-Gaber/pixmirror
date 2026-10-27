import { useMirrorSession } from "../features/mirroring";
import { useToolbarWindow } from "../features/toolbar";
import { ConnectPage } from "../pages/connect/ConnectPage";
import { ToolbarPage } from "../pages/toolbar/ToolbarPage";

export function App() {
  const session = useMirrorSession();
  useToolbarWindow(session.status.active);

  return session.status.active ? <ToolbarPage session={session} /> : <ConnectPage session={session} />;
}
