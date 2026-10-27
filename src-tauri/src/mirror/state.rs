use std::process::Child;
use std::sync::{Mutex, MutexGuard};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MirrorOptions {
    pub serial: Option<String>,
    /// high | gaming | eco | custom
    pub preset: Option<String>,
    pub max_size: Option<u32>,
    pub video_bit_rate: Option<String>,
    pub max_fps: Option<u32>,
    pub turn_screen_off: Option<bool>,
    pub stay_awake: Option<bool>,
    pub window_title: Option<String>,
}

pub struct Recording {
    pub path: String,
    pub started_at_ms: u64,
}

/// A mirroring session exists while `options` is set. `child` is briefly `None`
/// while scrcpy restarts to start/stop recording.
#[derive(Default)]
pub struct Session {
    pub child: Option<Child>,
    pub options: Option<MirrorOptions>,
    pub recording: Option<Recording>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MirrorStatus {
    pub active: bool,
    pub serial: Option<String>,
    pub recording: bool,
    pub recording_started_at: Option<u64>,
    pub recording_path: Option<String>,
}

#[derive(Default)]
pub struct MirrorState {
    session: Mutex<Session>,
    operation: Mutex<()>,
}

impl MirrorState {
    pub fn session(&self) -> MutexGuard<'_, Session> {
        self.session.lock().unwrap_or_else(|e| e.into_inner())
    }

    /// Serializes start/stop/record so scrcpy restarts never overlap.
    pub fn begin_operation(&self) -> MutexGuard<'_, ()> {
        self.operation.lock().unwrap_or_else(|e| e.into_inner())
    }

    pub fn scrcpy_pid(&self) -> Option<u32> {
        self.session().child.as_ref().map(Child::id)
    }
}
