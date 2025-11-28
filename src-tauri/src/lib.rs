mod git_ops;
mod file_ops;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      // Git operations
      git_ops::git_init,
      git_ops::git_commit,
      git_ops::git_commit_file,
      git_ops::git_log,
      git_ops::git_checkout_file,
      git_ops::git_status,
      // File operations
      file_ops::create_project_directory,
      file_ops::read_artifact_file,
      file_ops::write_artifact_file,
      file_ops::list_artifacts,
      file_ops::delete_artifact_file,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
