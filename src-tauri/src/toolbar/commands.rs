use tauri::{AppHandle, LogicalSize, Manager, Size};

use super::restore;
use super::state::{SavedFrame, ToolbarState};
use super::{main_window, TOOLBAR_HEIGHT, TOOLBAR_WIDTH};
use crate::mirror::state::MirrorState;
#[cfg(windows)]
use crate::shared::win32;

fn logical((width, height): (f64, f64)) -> Size {
    Size::Logical(LogicalSize::new(width, height))
}

/// Shrink the main window into the slim toolbar that follows the scrcpy window.
#[tauri::command]
pub async fn enter_toolbar_mode(app: AppHandle) -> Result<(), String> {
    let toolbar = app.state::<ToolbarState>();
    if toolbar.is_active() {
        return Ok(());
    }

    let window = main_window(&app)?;
    let maximized = window.is_maximized().unwrap_or(false);
    if maximized {
        let _ = window.unmaximize();
    }
    let saved = SavedFrame {
        position: window.outer_position().map_err(|e| e.to_string())?,
        size: window.inner_size().map_err(|e| e.to_string())?,
        maximized,
    };

    let _ = window.set_min_size(None::<Size>);
    let _ = window.set_maximizable(false);
    let _ = window.set_resizable(false);
    let _ = window.set_decorations(false);
    let _ = window.set_shadow(true);
    let _ = window.set_size(logical((TOOLBAR_WIDTH, TOOLBAR_HEIGHT)));

    let generation = toolbar.activate(saved);

    #[cfg(windows)]
    super::dock::spawn(app.clone(), generation);
    #[cfg(not(windows))]
    let _ = generation;

    Ok(())
}

/// Restore the main window to the size/position it had before toolbar mode.
#[tauri::command]
pub async fn exit_toolbar_mode(app: AppHandle) -> Result<(), String> {
    restore::restore_if_needed(&app)
}

/// Minimize the scrcpy window and the docked toolbar together (taskbar).
#[tauri::command]
pub async fn minimize_mirror_session(app: AppHandle) -> Result<(), String> {
    #[cfg(windows)]
    {
        if let Some(pid) = app.state::<MirrorState>().scrcpy_pid() {
            if let Some(hwnd) = win32::find_main_window(pid) {
                win32::minimize(hwnd);
            }
        }
    }

    let window = main_window(&app)?;
    window.minimize().map_err(|e| e.to_string())?;
    Ok(())
}
