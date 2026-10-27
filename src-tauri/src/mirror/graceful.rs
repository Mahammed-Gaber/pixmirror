use std::process::Child;
use std::time::Duration;

/// Stop scrcpy gracefully so MP4/MKV recordings can finalize properly.
pub fn stop_scrcpy_gracefully(child: &mut Child) -> std::io::Result<()> {
    #[cfg(windows)]
    {
        use crate::shared::win32;

        if let Some(hwnd) = win32::find_main_window(child.id()) {
            win32::post_close(hwnd);
            if wait_for_exit(child)? {
                return Ok(());
            }
        }
    }

    #[cfg(unix)]
    {
        unsafe {
            libc::kill(child.id() as i32, libc::SIGTERM);
        }
        if wait_for_exit(child)? {
            return Ok(());
        }
    }

    child.kill()
}

fn wait_for_exit(child: &mut Child) -> std::io::Result<bool> {
    for _ in 0..100 {
        if child.try_wait()?.is_some() {
            return Ok(true);
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    Ok(false)
}
