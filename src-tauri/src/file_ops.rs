use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct ArtifactMetadata {
    pub id: String,
    pub title: String,
    pub status: String,
    pub priority: String,
    pub created: String,
}

/// Create a project directory structure
#[tauri::command]
pub fn create_project_directory(path: String) -> Result<String, String> {
    let project_path = Path::new(&path);
    
    // Create main project directory
    fs::create_dir_all(project_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;
    
    // Create subdirectories
    fs::create_dir_all(project_path.join("requirements"))
        .map_err(|e| format!("Failed to create requirements directory: {}", e))?;
    fs::create_dir_all(project_path.join("usecases"))
        .map_err(|e| format!("Failed to create usecases directory: {}", e))?;
    fs::create_dir_all(project_path.join("testcases"))
        .map_err(|e| format!("Failed to create testcases directory: {}", e))?;
    fs::create_dir_all(project_path.join("information"))
        .map_err(|e| format!("Failed to create information directory: {}", e))?;
    
    Ok(path)
}

/// Read an artifact file
#[tauri::command]
pub fn read_artifact_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

/// Write an artifact file
#[tauri::command]
pub fn write_artifact_file(path: String, content: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }
    
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// List all artifact files in a directory
#[tauri::command]
pub fn list_artifacts(project_path: String, artifact_type: String) -> Result<Vec<String>, String> {
    let dir_path = Path::new(&project_path).join(&artifact_type);
    
    if !dir_path.exists() {
        return Ok(Vec::new());
    }
    
    let entries = fs::read_dir(&dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    let mut files = Vec::new();
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        
        if path.extension().and_then(|s| s.to_str()) == Some("md") {
            if let Some(file_name) = path.file_name().and_then(|s| s.to_str()) {
                files.push(file_name.to_string());
            }
        }
    }
    
    Ok(files)
}

/// Delete an artifact file
#[tauri::command]
pub fn delete_artifact_file(path: String) -> Result<(), String> {
    fs::remove_file(&path)
        .map_err(|e| format!("Failed to delete file: {}", e))
}
