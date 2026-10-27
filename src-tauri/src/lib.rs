mod capture;
mod devices;
mod mirror;
mod settings;
mod shared;
mod toolbar;

use mirror::state::MirrorState;
use toolbar::state::ToolbarState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .manage(MirrorState::default())
        .manage(ToolbarState::default())
        .invoke_handler(tauri::generate_handler![
            devices::commands::get_adb_version,
            devices::commands::list_devices,
            devices::commands::get_device_details,
            devices::commands::get_device_stats,
            devices::commands::send_key,
            mirror::commands::start_mirroring,
            mirror::commands::stop_mirroring,
            mirror::commands::get_mirror_status,
            mirror::commands::start_recording,
            mirror::commands::stop_recording,
            capture::commands::take_screenshot,
            settings::commands::get_save_directory,
            settings::commands::set_save_directory,
            settings::commands::open_save_directory,
            settings::commands::reveal_capture,
            toolbar::commands::enter_toolbar_mode,
            toolbar::commands::exit_toolbar_mode,
            toolbar::commands::minimize_mirror_session,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                mirror::service::shutdown(app);
            }
        });
}
