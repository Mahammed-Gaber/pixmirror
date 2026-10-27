pub mod commands;
#[cfg(windows)]
mod dock;
#[cfg_attr(not(windows), allow(dead_code))]
mod geometry;
pub mod restore;
pub mod state;

use tauri::{AppHandle, Manager, WebviewWindow};

/// Logical sizes; must match the toolbar layout in `src/features/toolbar`.
pub const TOOLBAR_WIDTH: f64 = 56.0;
/// Tall enough for the full strip; the React toolbar also scrolls if extras (clock / progress) overflow.
pub const TOOLBAR_HEIGHT: f64 = 580.0;
pub const DOCK_GAP: f64 = 8.0;

/// Must match `app.windows[0]` in `tauri.conf.json`.
pub const MAIN_SIZE: (f64, f64) = (880.0, 560.0);
pub const MAIN_MIN_SIZE: (f64, f64) = (760.0, 500.0);

pub fn main_window(app: &AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "errors.window_missing".to_string())
}
