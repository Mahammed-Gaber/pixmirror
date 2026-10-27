pub mod commands;
pub mod parse;
mod stats;

pub use stats::DeviceStats;

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfo {
    pub serial: String,
    pub state: String,
    pub model: Option<String>,
    pub product: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceDetails {
    pub android_version: Option<String>,
    pub manufacturer: Option<String>,
    pub battery_level: Option<u8>,
}
