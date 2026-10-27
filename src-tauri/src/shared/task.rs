/// Run blocking work (adb calls, process waits) off the main thread so the window stays responsive.
pub async fn run_blocking<T, F>(work: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, String> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(work)
        .await
        .map_err(|e| crate::shared::errors::err_key("errors.task_failed", &[("detail", &e.to_string())]))?
}
