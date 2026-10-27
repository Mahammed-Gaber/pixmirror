use serde::Serialize;
use tauri::AppHandle;

use crate::shared::adb::adb_device;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStats {
    /// Whole-device CPU usage 0–100 when available.
    pub cpu_percent: Option<f32>,
    pub ram_used_mb: Option<u64>,
    pub ram_total_mb: Option<u64>,
    pub battery_level: Option<u8>,
    /// charging | discharging | full | not_charging | unknown
    pub battery_status: Option<String>,
    /// Rough top process label from cpuinfo when present.
    pub top_process: Option<String>,
}

/// Collect CPU / RAM / battery via adb shell. Best-effort — fields may be null on locked OEMs.
pub fn fetch_device_stats(app: &AppHandle, serial: &str) -> Result<DeviceStats, String> {
    match adb_device(app, serial, &["shell", STATS_SCRIPT]) {
        Ok(out) => Ok(parse_device_stats(&out)),
        // `dumpsys | head` often exits non-zero (SIGPIPE) while stdout is still valid.
        Err(err) => {
            if let Some(payload) = stats_payload_from_error(&err) {
                return Ok(parse_device_stats(payload));
            }
            Err(err)
        }
    }
}

/// Recover dump text when adb wrapped a successful-looking payload as `errors.raw|detail=…`.
fn stats_payload_from_error(err: &str) -> Option<&str> {
    const PREFIX: &str = "errors.raw|detail=";
    let detail = err.strip_prefix(PREFIX)?;
    if detail.contains("---MEM---") {
        Some(detail)
    } else {
        None
    }
}

/// meminfo + battery + cpuinfo + /proc/stat delta for CPU %.
/// Always end with `exit 0`: pipelines with `head` can SIGPIPE and fail the shell otherwise.
const STATS_SCRIPT: &str = r#"
echo '---MEM---'
grep -E 'MemTotal|MemAvailable|MemFree' /proc/meminfo 2>/dev/null || true
echo '---BAT---'
dumpsys battery 2>/dev/null | grep -E '^\s*(level|status):' || true
echo '---CPU---'
dumpsys cpuinfo 2>/dev/null | head -n 50 || true
echo '---STAT---'
head -n 1 /proc/stat 2>/dev/null || true
sleep 1
head -n 1 /proc/stat 2>/dev/null || true
exit 0
"#;

pub fn parse_device_stats(output: &str) -> DeviceStats {
    let mut section = "";
    let mut mem_total_kb: Option<u64> = None;
    let mut mem_avail_kb: Option<u64> = None;
    let mut mem_free_kb: Option<u64> = None;
    let mut battery_level: Option<u8> = None;
    let mut battery_status: Option<String> = None;
    let mut cpu_percent: Option<f32> = None;
    let mut top_process: Option<String> = None;
    let mut stat_lines: Vec<String> = Vec::new();
    let mut cpu_section_lines: Vec<String> = Vec::new();

    for raw in output.lines() {
        let line = raw.trim();
        if line == "---MEM---" {
            section = "mem";
            continue;
        }
        if line == "---BAT---" {
            section = "bat";
            continue;
        }
        if line == "---CPU---" {
            section = "cpu";
            continue;
        }
        if line == "---STAT---" {
            section = "stat";
            continue;
        }
        if line.is_empty() {
            continue;
        }

        match section {
            "mem" => {
                if let Some(v) = parse_meminfo_kb(line, "MemTotal:") {
                    mem_total_kb = Some(v);
                } else if let Some(v) = parse_meminfo_kb(line, "MemAvailable:") {
                    mem_avail_kb = Some(v);
                } else if let Some(v) = parse_meminfo_kb(line, "MemFree:") {
                    mem_free_kb = Some(v);
                }
            }
            "bat" => {
                if let Some(rest) = line.strip_prefix("level:") {
                    battery_level = rest.trim().parse().ok();
                } else if let Some(rest) = line.strip_prefix("status:") {
                    battery_status = Some(battery_status_label(rest.trim()));
                }
            }
            "cpu" => cpu_section_lines.push(line.to_string()),
            "stat" => {
                if line.starts_with("cpu ") {
                    stat_lines.push(line.to_string());
                }
            }
            _ => {}
        }
    }

    if cpu_percent.is_none() {
        for line in &cpu_section_lines {
            if let Some(p) = parse_cpu_total(line) {
                cpu_percent = Some(p);
                break;
            }
        }
    }
    if cpu_percent.is_none() {
        cpu_percent = parse_cpu_from_process_lines(&cpu_section_lines);
    }
    if cpu_percent.is_none() && stat_lines.len() >= 2 {
        cpu_percent = parse_cpu_from_proc_stat(&stat_lines[0], &stat_lines[1]);
    }

    if top_process.is_none() {
        for line in &cpu_section_lines {
            if let Some(name) = parse_top_process(line) {
                top_process = Some(name);
                break;
            }
        }
    }

    let ram_total_mb = mem_total_kb.map(kb_to_mb);
    let avail = mem_avail_kb.or(mem_free_kb);
    let ram_used_mb = match (mem_total_kb, avail) {
        (Some(total), Some(a)) if total >= a => Some(kb_to_mb(total - a)),
        _ => None,
    };

    DeviceStats {
        cpu_percent,
        ram_used_mb,
        ram_total_mb,
        battery_level,
        battery_status,
        top_process,
    }
}

fn kb_to_mb(kb: u64) -> u64 {
    kb / 1024
}

fn parse_meminfo_kb(line: &str, prefix: &str) -> Option<u64> {
    let rest = line.strip_prefix(prefix)?.trim();
    rest.split_whitespace().next()?.parse().ok()
}

fn battery_status_label(code: &str) -> String {
    match code {
        "2" => "charging".into(),
        "3" => "discharging".into(),
        "4" => "not_charging".into(),
        "5" => "full".into(),
        other => other.to_string(),
    }
}

/// e.g. `45% TOTAL: ...` or `TOTAL: 45% user + ...`
fn parse_cpu_total(line: &str) -> Option<f32> {
    let lower = line.to_ascii_lowercase();
    if !lower.contains("total") {
        return None;
    }
    if let Some(p) = parse_leading_percent(line) {
        return Some(p);
    }
    for token in line.split_whitespace() {
        if token.ends_with('%') {
            let num = token.trim_end_matches('%');
            if let Ok(v) = num.parse::<f32>() {
                return Some(v.clamp(0.0, 100.0));
            }
        }
    }
    None
}

fn parse_leading_percent(line: &str) -> Option<f32> {
    let t = line.trim().strip_prefix('+').unwrap_or(line.trim());
    let before = t.split('%').next()?.trim();
    before
        .split_whitespace()
        .last()?
        .parse()
        .ok()
        .map(|v: f32| v.clamp(0.0, 100.0))
}

fn parse_cpu_from_process_lines(lines: &[String]) -> Option<f32> {
    let mut max = 0.0f32;
    for line in lines {
        let lower = line.to_ascii_lowercase();
        if lower.contains("total") || lower.contains("load:") || lower.contains("cpu usage") {
            continue;
        }
        if let Some(p) = parse_leading_percent(line) {
            max = max.max(p);
        }
    }
    if max > 0.0 {
        Some(max.min(100.0))
    } else {
        None
    }
}

fn parse_cpu_from_proc_stat(a: &str, b: &str) -> Option<f32> {
    let idle_a = proc_stat_idle(a)?;
    let idle_b = proc_stat_idle(b)?;
    let total_a = proc_stat_total(a)?;
    let total_b = proc_stat_total(b)?;
    let idle_d = idle_b.saturating_sub(idle_a);
    let total_d = total_b.saturating_sub(total_a);
    if total_d == 0 {
        return None;
    }
    let used = total_d.saturating_sub(idle_d);
    Some((used as f32 / total_d as f32 * 100.0).clamp(0.0, 100.0))
}

fn proc_stat_total(line: &str) -> Option<u64> {
    let parts = line.split_whitespace().collect::<Vec<_>>();
    if parts.len() < 5 {
        return None;
    }
    Some(parts[1..].iter().filter_map(|p| p.parse::<u64>().ok()).sum())
}

fn proc_stat_idle(line: &str) -> Option<u64> {
    let parts = line.split_whitespace().collect::<Vec<_>>();
    if parts.len() < 5 {
        return None;
    }
    let idle = parts[4].parse::<u64>().ok()?;
    let iowait = parts.get(5).and_then(|p| p.parse::<u64>().ok()).unwrap_or(0);
    Some(idle + iowait)
}

/// First per-process line like `12% 1001/com.android.systemui: 8% user + 4% kernel`
fn parse_top_process(line: &str) -> Option<String> {
    let lower = line.to_ascii_lowercase();
    if lower.contains("total") || lower.contains("load:") || lower.contains("cpu usage") {
        return None;
    }
    if !line.contains('%') {
        return None;
    }
    for token in line.split_whitespace() {
        if let Some((_, name)) = token.split_once('/') {
            let name = name.trim_end_matches(':');
            if !name.is_empty() {
                return Some(name.to_string());
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_typical_stats() {
        let sample = r#"
---MEM---
MemTotal:        5730304 kB
MemAvailable:    2100456 kB
MemFree:          312000 kB
---BAT---
  level: 82
  status: 2
---CPU---
Load: 1.2 / 1.1 / 1.0
CPU usage from 0ms to 1000ms ago:
  18% 1234/com.android.systemui: 10% user + 8% kernel
  5% 567/com.example.app: 4% user + 1% kernel
45% TOTAL: 30% user + 15% kernel
---STAT---
cpu  100 50 30 400 20 0 0 0 0 0
cpu  200 60 40 450 25 0 0 0 0 0
"#;
        let s = parse_device_stats(sample);
        assert_eq!(s.battery_level, Some(82));
        assert_eq!(s.cpu_percent, Some(45.0));
        assert_eq!(s.top_process.as_deref(), Some("com.android.systemui"));
    }

    #[test]
    fn parses_plus_percent_cpu_lines() {
        let sample = r#"
---MEM---
MemTotal: 1000 kB
MemAvailable: 500 kB
---BAT---
level: 50
status: 3
---CPU---
CPU usage from 0ms to 500ms ago:
  +15% 999/com.foo.bar: 10% user + 5% kernel
---STAT---
"#;
        let s = parse_device_stats(sample);
        assert_eq!(s.cpu_percent, Some(15.0));
    }
}
