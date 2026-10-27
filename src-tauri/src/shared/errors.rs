/// Map common adb/scrcpy failures to stable i18n keys (translated in the UI).
pub fn friendly_error(raw: &str) -> String {
    let lower = raw.to_lowercase();

    if lower.contains("unauthorized") || lower.contains("authorizing") {
        return "errors.unauthorized".into();
    }
    // adb wording is often `device 'SERIAL' not found`, not the literal "device not found".
    if lower.contains("no devices")
        || lower.contains("device not found")
        || lower.contains("no such device")
        || (lower.contains("not found") && lower.contains("device"))
    {
        return "errors.no_device".into();
    }
    if lower.contains("offline")
        || lower.contains("connection closed")
        || lower.trim() == "closed"
        || lower.contains("broken pipe")
        || lower.contains("connection reset")
    {
        return "errors.offline".into();
    }
    if lower.contains("protocol fault")
        || lower.contains("failed to start daemon")
        || lower.contains("cannot connect to daemon")
    {
        return "errors.adb_daemon".into();
    }
    if lower.contains("more than one device") {
        return "errors.multiple_devices".into();
    }
    if lower.contains("cannot create")
        || lower.contains("failed to create")
        || lower.contains("no such file or directory")
        || lower.contains("the system cannot find the path")
        || lower.contains("filename, directory name, or volume label syntax is incorrect")
    {
        return "errors.bad_path".into();
    }

    let trimmed = raw.trim();
    if trimmed.is_empty() {
        "errors.unknown".into()
    } else {
        let brief: String = trimmed.chars().take(220).collect();
        let detail = if trimmed.chars().count() > 220 {
            format!("{brief}…")
        } else {
            brief
        };
        format!("errors.raw|detail={detail}")
    }
}

/// Build `key|name=value|…` for UI translation with placeholders.
pub fn err_key(key: &str, vars: &[(&str, &str)]) -> String {
    if vars.is_empty() {
        return key.to_string();
    }
    let mut out = key.to_string();
    for (name, value) in vars {
        // Avoid breaking the pipe protocol with raw `|` or newlines in values.
        let safe = value.replace('|', "/").replace('\n', " ").replace('\r', "");
        out.push('|');
        out.push_str(name);
        out.push('=');
        out.push_str(&safe);
    }
    out
}
