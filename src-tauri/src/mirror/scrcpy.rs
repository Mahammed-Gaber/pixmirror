use std::io::Read;
use std::process::{Child, Stdio};
use std::time::Duration;

use tauri::AppHandle;

use super::graceful::stop_scrcpy_gracefully;
use super::state::MirrorOptions;
use crate::shared::binaries::tool_command;
use crate::shared::errors::{err_key, friendly_error};

fn build_args(options: &MirrorOptions) -> Vec<String> {
    let mut args = Vec::new();

    if let Some(serial) = options.serial.as_deref().filter(|s| !s.is_empty()) {
        args.push(format!("--serial={serial}"));
    }

    match options.preset.as_deref().unwrap_or("high") {
        "gaming" => {
            args.push("--max-size=1280".into());
            args.push("--video-bit-rate=8M".into());
            args.push("--max-fps=60".into());
        }
        "eco" => {
            args.push("--max-size=1024".into());
            args.push("--video-bit-rate=2M".into());
            args.push("--max-fps=30".into());
        }
        "high" => {
            args.push("--video-bit-rate=8M".into());
        }
        _ => {
            if let Some(max_size) = options.max_size {
                args.push(format!("--max-size={max_size}"));
            }
            if let Some(bitrate) = &options.video_bit_rate {
                args.push(format!("--video-bit-rate={bitrate}"));
            }
            if let Some(fps) = options.max_fps {
                args.push(format!("--max-fps={fps}"));
            }
        }
    }

    if options.turn_screen_off.unwrap_or(false) {
        args.push("--turn-screen-off".into());
    }
    if options.stay_awake.unwrap_or(true) {
        args.push("--stay-awake".into());
    }

    let title = options
        .window_title
        .as_deref()
        .map(str::trim)
        .filter(|t| !t.is_empty())
        .unwrap_or("Android");
    args.push(format!("--window-title={title}"));

    args
}

pub fn spawn(app: &AppHandle, options: &MirrorOptions, record_path: Option<&str>) -> Result<Child, String> {
    let mut args = build_args(options);

    if let Some(path) = record_path {
        args.push(format!("--record={path}"));
        // AAC muxes reliably into MP4; some devices fail Opus silently (video-only file).
        args.push("--audio-codec=aac".into());
    }

    let mut child = tool_command(app, "scrcpy")?
        .args(&args)
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| err_key("errors.scrcpy_start_failed", &[("detail", &e.to_string())]))?;

    std::thread::sleep(Duration::from_millis(900));
    if let Ok(Some(status)) = child.try_wait() {
        if !status.success() {
            let mut stderr = String::new();
            if let Some(mut pipe) = child.stderr.take() {
                let _ = pipe.read_to_string(&mut stderr);
            }
            return Err(friendly_error(&stderr));
        }
    }

    // A full, unread stderr pipe would block scrcpy mid-session.
    if let Some(mut pipe) = child.stderr.take() {
        std::thread::spawn(move || {
            let _ = std::io::copy(&mut pipe, &mut std::io::sink());
        });
    }

    Ok(child)
}

pub fn stop(child: &mut Child) {
    let _ = stop_scrcpy_gracefully(child);
    let _ = child.wait();
}
