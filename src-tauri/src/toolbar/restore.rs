use std::time::Duration;

use tauri::{AppHandle, LogicalSize, Manager, Size};

use super::state::{SavedFrame, ToolbarState};
use super::{main_window, MAIN_MIN_SIZE, MAIN_SIZE, TOOLBAR_WIDTH};

fn logical((width, height): (f64, f64)) -> Size {
    Size::Logical(LogicalSize::new(width, height))
}

/// True when the saved size is clearly the slim toolbar (enter raced / bad snapshot).
fn looks_like_toolbar(frame: &SavedFrame, scale: f64) -> bool {
    let toolbar_w = (TOOLBAR_WIDTH * scale).round() as u32;
    frame.size.width <= toolbar_w.saturating_add(40)
}

fn settle() {
    #[cfg(windows)]
    std::thread::sleep(Duration::from_millis(50));
}

/// Leave toolbar mode and restore the main connect window.
///
/// Safe to call anytime: no-op if toolbar mode is already off. Used both by the
/// explicit `exit_toolbar_mode` command and whenever mirroring ends (scrcpy quit /
/// Wi‑Fi drop), so the window cannot stay stuck at toolbar size.
///
/// On Windows, `set_size` while minimized is often ignored and the next taskbar
/// restore uses the old slim size — so we unminimize, apply the frame, then
/// minimize again if the user had the toolbar in the taskbar.
pub fn restore_if_needed(app: &AppHandle) -> Result<(), String> {
    let Some(saved) = app.state::<ToolbarState>().deactivate() else {
        return Ok(());
    };

    let window = main_window(app)?;
    let scale = window.scale_factor().unwrap_or(1.0);
    let was_minimized = window.is_minimized().unwrap_or(false);

    let _ = window.set_always_on_top(false);

    // Size/decorations must be applied while the window is shown; otherwise
    // Windows keeps the slim toolbar size for the next taskbar restore.
    if was_minimized {
        let _ = window.unminimize();
        settle();
    }

    let _ = window.set_decorations(true);
    let _ = window.set_resizable(true);
    let _ = window.set_maximizable(true);
    settle();

    match saved {
        Some(frame) if !looks_like_toolbar(&frame, scale) => {
            let _ = window.set_size(frame.size);
            let _ = window.set_position(frame.position);
            if frame.maximized {
                let _ = window.maximize();
            }
        }
        _ => {
            let _ = window.set_size(logical(MAIN_SIZE));
            let _ = window.center();
        }
    }

    let _ = window.set_min_size(Some(logical(MAIN_MIN_SIZE)));

    if was_minimized {
        // Keep it in the taskbar, but with the correct restored frame so the
        // next click opens the full connect UI — not a clipped toolbar shell.
        settle();
        let _ = window.minimize();
    } else {
        let _ = window.unminimize();
        let _ = window.set_focus();
    }

    Ok(())
}
