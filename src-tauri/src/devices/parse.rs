use super::{DeviceDetails, DeviceInfo};

fn parse_prop(line: &str, key: &str) -> Option<String> {
    line.split_whitespace()
        .find_map(|part| part.strip_prefix(&format!("{key}:")))
        .map(|v| v.replace('_', " "))
}

fn is_usb_serial(serial: &str) -> bool {
    !serial.contains(':') && !serial.contains("._adb")
}

/// Parse `adb devices -l` output.
pub fn parse_device_list(output: &str) -> Vec<DeviceInfo> {
    output
        .lines()
        .skip(1)
        .filter_map(|line| {
            let line = line.trim();
            let mut parts = line.split_whitespace();
            let serial = parts.next()?;
            if !is_usb_serial(serial) {
                return None;
            }
            let state = parts.next()?;
            Some(DeviceInfo {
                serial: serial.to_string(),
                state: state.to_string(),
                model: parse_prop(line, "model"),
                product: parse_prop(line, "product"),
            })
        })
        .collect()
}

/// Parse the combined `getprop` / `dumpsys battery` shell output (see `DETAILS_SCRIPT`).
pub fn parse_device_details(output: &str) -> DeviceDetails {
    let mut lines = output.lines().map(str::trim);
    let non_empty = |v: Option<&str>| v.filter(|s| !s.is_empty()).map(str::to_string);

    let android_version = non_empty(lines.next());
    let manufacturer = non_empty(lines.next());
    let battery_level = output
        .lines()
        .find_map(|l| l.trim().strip_prefix("level:"))
        .and_then(|v| v.trim().parse().ok());

    DeviceDetails {
        android_version,
        manufacturer,
        battery_level,
    }
}

pub const DETAILS_SCRIPT: &str =
    "getprop ro.build.version.release; getprop ro.product.manufacturer; dumpsys battery | grep level";
