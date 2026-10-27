use std::time::{SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Manager};

use super::scrcpy;
use super::state::{MirrorOptions, MirrorState, MirrorStatus, Recording, Session};
use crate::settings::store::{resolve_save_dir, timestamp};

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or_default()
}

pub fn start(app: &AppHandle, options: MirrorOptions) -> Result<(), String> {
    let state = app.state::<MirrorState>();
    let _op = state.begin_operation();

    if state.session().options.is_some() {
        return Err("errors.mirror_already".into());
    }

    let child = scrcpy::spawn(app, &options, None)?;
    *state.session() = Session {
        child: Some(child),
        options: Some(options),
        recording: None,
    };
    Ok(())
}

/// Stops mirroring; returns the recording path if one was in progress.
pub fn stop(app: &AppHandle) -> Result<Option<String>, String> {
    let state = app.state::<MirrorState>();
    let _op = state.begin_operation();

    let Session {
        child, recording, ..
    } = std::mem::take(&mut *state.session());

    if let Some(mut child) = child {
        scrcpy::stop(&mut child);
    }
    Ok(recording.map(|r| r.path))
}

pub fn status(app: &AppHandle) -> MirrorStatus {
    let state = app.state::<MirrorState>();
    let mut session = state.session();

    let exited = session
        .child
        .as_mut()
        .is_some_and(|child| matches!(child.try_wait(), Ok(Some(_))));
    if exited {
        *session = Session::default();
    }

    MirrorStatus {
        active: session.options.is_some(),
        serial: session.options.as_ref().and_then(|o| o.serial.clone()),
        recording: session.recording.is_some(),
        recording_started_at: session.recording.as_ref().map(|r| r.started_at_ms),
        recording_path: session.recording.as_ref().map(|r| r.path.clone()),
    }
}

/// Restart scrcpy with `--record` (scrcpy can only record from launch).
pub fn start_recording(app: &AppHandle) -> Result<String, String> {
    let state = app.state::<MirrorState>();
    let _op = state.begin_operation();

    let options = {
        let session = state.session();
        if session.recording.is_some() {
            return Err("errors.recording_already".into());
        }
        session
            .options
            .clone()
            .ok_or("errors.recording_need_mirror")?
    };

    let path = resolve_save_dir(app)?
        .join("recordings")
        .join(format!("recording_{}.mp4", timestamp()))
        .to_string_lossy()
        .to_string();

    restart(app, &state, &options, Some(&path))?;
    state.session().recording = Some(Recording {
        path: path.clone(),
        started_at_ms: now_ms(),
    });
    Ok(path)
}

/// Stop scrcpy (finalizing the file) and resume plain mirroring.
pub fn stop_recording(app: &AppHandle) -> Result<String, String> {
    let state = app.state::<MirrorState>();
    let _op = state.begin_operation();

    let (options, recording) = {
        let mut session = state.session();
        let recording = session.recording.take().ok_or("errors.recording_none")?;
        let options = session.options.clone().ok_or("errors.mirror_none")?;
        (options, recording)
    };

    // The file is already finalized once the old scrcpy exits, so a failed
    // relaunch only ends the session.
    let _ = restart(app, &state, &options, None);
    Ok(recording.path)
}

fn restart(
    app: &AppHandle,
    state: &MirrorState,
    options: &MirrorOptions,
    record_path: Option<&str>,
) -> Result<(), String> {
    let old = state.session().child.take();
    if let Some(mut child) = old {
        scrcpy::stop(&mut child);
    }

    match scrcpy::spawn(app, options, record_path) {
        Ok(child) => {
            state.session().child = Some(child);
            Ok(())
        }
        Err(err) => {
            match record_path.and_then(|_| scrcpy::spawn(app, options, None).ok()) {
                Some(child) => state.session().child = Some(child),
                None => *state.session() = Session::default(),
            }
            Err(err)
        }
    }
}

/// Called on app exit so scrcpy doesn't outlive the app.
pub fn shutdown(app: &AppHandle) {
    let _ = stop(app);
}
