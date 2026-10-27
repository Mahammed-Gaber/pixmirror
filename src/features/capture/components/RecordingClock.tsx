import { Mono } from "@/shared/components/Mono";
import { useNow } from "@/shared/hooks/useNow";
import { formatDuration } from "@/shared/utils/format";

export function RecordingClock({ startedAt }: { startedAt: number }) {
  const now = useNow(true);
  return <Mono className="text-[10px] leading-none text-rec">{formatDuration(now - startedAt)}</Mono>;
}
