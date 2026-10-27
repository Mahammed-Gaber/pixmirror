use std::time::Duration;

use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewWindow};

use super::geometry::{dock_position, Bounds};
use super::state::ToolbarState;
use super::{main_window, DOCK_GAP, TOOLBAR_HEIGHT, TOOLBAR_WIDTH};
use crate::shared::win32;
use crate::mirror::state::MirrorState;

const POLL_INTERVAL: Duration = Duration::from_millis(100);

struct Target {
    position: Option<PhysicalPosition<i32>>,
    size: PhysicalSize<u32>,
    on_top: bool,
}

#[derive(Default)]
struct Applied {
    position: Option<PhysicalPosition<i32>>,
    size: Option<PhysicalSize<u32>>,
    on_top: Option<bool>,
}

/// Keep the toolbar glued to the scrcpy window until `generation` ends.
pub fn spawn(app: AppHandle, generation: u64) {
    std::thread::spawn(move || {
        let mut applied = Applied::default();
        loop {
            let toolbar = app.state::<ToolbarState>();
            if !toolbar.is_active() || toolbar.generation() != generation {
                break;
            }

            if let (Some(window), Some(target)) = (main_window(&app).ok(), compute_target(&app)) {
                toolbar.apply_if_current(generation, || apply(&window, &target, &mut applied));
            }

            std::thread::sleep(POLL_INTERVAL);
        }
    });
}

fn compute_target(app: &AppHandle) -> Option<Target> {
    // scrcpy is briefly absent while it restarts for recording; keep the toolbar where it is.
    let pid = app.state::<MirrorState>().scrcpy_pid()?;
    let hwnd = win32::find_main_window(pid)?;

    let window = main_window(app).ok()?;
    // If the user parked our toolbar in the taskbar, do not keep calling set_size —
    // Windows would remember the slim size and reopen clipped after mirroring ends.
    if window.is_minimized().unwrap_or(false) {
        return None;
    }

    let scale = window.scale_factor().ok()?;
    let size = PhysicalSize::new(
        (TOOLBAR_WIDTH * scale).round() as u32,
        (TOOLBAR_HEIGHT * scale).round() as u32,
    );

    let foreground = win32::foreground_pid();
    let on_top = foreground == Some(pid) || foreground == Some(std::process::id());

    if win32::is_minimized(hwnd) {
        return Some(Target {
            position: None,
            size,
            on_top: false,
        });
    }

    let frame = win32::frame_rect(hwnd)?;
    let mirror = Bounds {
        left: frame.left,
        top: frame.top,
        right: frame.right,
        bottom: frame.bottom,
    };
    let work = work_area_at(app, frame.center()).unwrap_or(mirror);
    let gap = (DOCK_GAP * scale).round() as i32;
    let (x, y) = dock_position(mirror, (size.width as i32, size.height as i32), gap, work);

    Some(Target {
        position: Some(PhysicalPosition::new(x, y)),
        size,
        on_top,
    })
}

fn work_area_at(app: &AppHandle, (x, y): (i32, i32)) -> Option<Bounds> {
    let monitors = app.available_monitors().ok()?;
    let monitor = monitors
        .iter()
        .find(|m| {
            let p = m.position();
            let s = m.size();
            x >= p.x && x < p.x + s.width as i32 && y >= p.y && y < p.y + s.height as i32
        })
        .cloned()
        .or_else(|| app.primary_monitor().ok().flatten())?;

    let area = monitor.work_area();
    Some(Bounds {
        left: area.position.x,
        top: area.position.y,
        right: area.position.x + area.size.width as i32,
        bottom: area.position.y + area.size.height as i32,
    })
}

fn apply(window: &WebviewWindow, target: &Target, applied: &mut Applied) {
    if applied.size != Some(target.size) && window.set_size(target.size).is_ok() {
        applied.size = Some(target.size);
    }
    if let Some(position) = target.position {
        if applied.position != Some(position) && window.set_position(position).is_ok() {
            applied.position = Some(position);
        }
    }
    if applied.on_top != Some(target.on_top) && window.set_always_on_top(target.on_top).is_ok() {
        applied.on_top = Some(target.on_top);
    }
}
