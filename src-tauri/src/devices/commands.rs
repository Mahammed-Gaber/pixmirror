use tauri::AppHandle;

use super::parse::{parse_device_details, parse_device_list, DETAILS_SCRIPT};
use super::stats::fetch_device_stats;
use super::{DeviceDetails, DeviceInfo, DeviceStats};
use crate::shared::adb::{adb, adb_device};
use crate::shared::errors::err_key;
use crate::shared::task::run_blocking;

#[tauri::command]
pub async fn get_adb_version(app: AppHandle) -> Result<String, String> {
    run_blocking(move || {
        let out = adb(&app, ["version"])?;
        Ok(out.lines().next().unwrap_or("adb").trim().to_string())
    })
    .await
}

#[tauri::command]
pub async fn list_devices(app: AppHandle) -> Result<Vec<DeviceInfo>, String> {
    run_blocking(move || Ok(parse_device_list(&adb(&app, ["devices", "-l"])?))).await
}

#[tauri::command]
pub async fn get_device_details(app: AppHandle, serial: String) -> Result<DeviceDetails, String> {
    run_blocking(move || {
        let out = adb_device(&app, &serial, &["shell", DETAILS_SCRIPT])?;
        Ok(parse_device_details(&out))
    })
    .await
}

#[tauri::command]
pub async fn get_device_stats(app: AppHandle, serial: String) -> Result<DeviceStats, String> {
    run_blocking(move || fetch_device_stats(&app, &serial)).await
}

/// Send an Android navigation/hardware key. Only a fixed set of keys is allowed.
#[tauri::command]
pub async fn send_key(app: AppHandle, serial: String, key: String) -> Result<(), String> {
    let code = match key.as_str() {
        "back" => "4",
        "home" => "3",
        "recents" => "187",
        "volume_up" => "24",
        "volume_down" => "25",
        "power" => "26",
        _ => return Err(err_key("errors.unsupported_key", &[("key", &key)])),
    };

    run_blocking(move || {
        adb_device(&app, &serial, &["shell", "input", "keyevent", code])?;
        Ok(())
    })
    .await
}
