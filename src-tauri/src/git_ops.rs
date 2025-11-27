use git2::{Repository, Signature, IndexAddOption, Oid};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct CommitInfo {
    pub hash: String,
    pub message: String,
    pub author: String,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileStatus {
    pub path: String,
    pub status: String,
}

/// Initialize a new Git repository
#[tauri::command]
pub fn git_init(repo_path: String) -> Result<String, String> {
    Repository::init(&repo_path)
        .map_err(|e| format!("Failed to initialize repository: {}", e))?;
    Ok("Repository initialized successfully".to_string())
}

/// Commit changes with a message
#[tauri::command]
pub fn git_commit(repo_path: String, message: String) -> Result<String, String> {
    let repo = Repository::open(&repo_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;
    
    // Get the index and write the tree
    let mut index = repo.index()
        .map_err(|e| format!("Failed to get index: {}", e))?;
    
    index.add_all(["*"].iter(), IndexAddOption::DEFAULT, None)
        .map_err(|e| format!("Failed to add files: {}", e))?;
    
    index.write()
        .map_err(|e| format!("Failed to write index: {}", e))?;
    
    let tree_id = index.write_tree()
        .map_err(|e| format!("Failed to write tree: {}", e))?;
    
    let tree = repo.find_tree(tree_id)
        .map_err(|e| format!("Failed to find tree: {}", e))?;
    
    // Get the signature
    let signature = Signature::now("ReqTrace User", "user@reqtrace.local")
        .map_err(|e| format!("Failed to create signature: {}", e))?;
    
    // Get parent commit if it exists
    let parent_commit = match repo.head() {
        Ok(head) => {
            let oid = head.target().ok_or("Failed to get HEAD target")?;
            Some(repo.find_commit(oid)
                .map_err(|e| format!("Failed to find parent commit: {}", e))?)
        },
        Err(_) => None,
    };
    
    // Create the commit
    let commit_oid = if let Some(parent) = parent_commit {
        repo.commit(
            Some("HEAD"),
            &signature,
            &signature,
            &message,
            &tree,
            &[&parent],
        )
    } else {
        repo.commit(
            Some("HEAD"),
            &signature,
            &signature,
            &message,
            &tree,
            &[],
        )
    }.map_err(|e| format!("Failed to create commit: {}", e))?;
    
    Ok(commit_oid.to_string())
}

/// Get commit history for a specific file
#[tauri::command]
pub fn git_log(repo_path: String, file_path: Option<String>) -> Result<Vec<CommitInfo>, String> {
    let repo = Repository::open(&repo_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;
    
    let mut revwalk = repo.revwalk()
        .map_err(|e| format!("Failed to create revwalk: {}", e))?;
    
    revwalk.push_head()
        .map_err(|e| format!("Failed to push HEAD: {}", e))?;
    
    let mut commits = Vec::new();
    
    for oid in revwalk {
        let oid = oid.map_err(|e| format!("Failed to get OID: {}", e))?;
        let commit = repo.find_commit(oid)
            .map_err(|e| format!("Failed to find commit: {}", e))?;
        
        // If file_path is specified, filter commits that touched this file
        if let Some(ref path) = file_path {
            // Simple approach: check if the commit message or changes involve this file
            // For a more sophisticated approach, we'd need to diff trees
            // For now, include all commits
        }
        
        commits.push(CommitInfo {
            hash: oid.to_string(),
            message: commit.message().unwrap_or("").to_string(),
            author: commit.author().name().unwrap_or("Unknown").to_string(),
            timestamp: commit.time().seconds(),
        });
    }
    
    Ok(commits)
}

/// Checkout a specific file at a specific commit
#[tauri::command]
pub fn git_checkout_file(
    repo_path: String,
    commit_hash: String,
    file_path: String,
) -> Result<String, String> {
    let repo = Repository::open(&repo_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;
    
    let oid = Oid::from_str(&commit_hash)
        .map_err(|e| format!("Invalid commit hash: {}", e))?;
    
    let commit = repo.find_commit(oid)
        .map_err(|e| format!("Failed to find commit: {}", e))?;
    
    let tree = commit.tree()
        .map_err(|e| format!("Failed to get tree: {}", e))?;
    
    let entry = tree.get_path(Path::new(&file_path))
        .map_err(|e| format!("File not found in commit: {}", e))?;
    
    let blob = repo.find_blob(entry.id())
        .map_err(|e| format!("Failed to find blob: {}", e))?;
    
    let content = std::str::from_utf8(blob.content())
        .map_err(|e| format!("Failed to decode UTF-8: {}", e))?;
    
    Ok(content.to_string())
}

/// Get repository status
#[tauri::command]
pub fn git_status(repo_path: String) -> Result<Vec<FileStatus>, String> {
    let repo = Repository::open(&repo_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;
    
    let statuses = repo.statuses(None)
        .map_err(|e| format!("Failed to get status: {}", e))?;
    
    let mut file_statuses = Vec::new();
    
    for entry in statuses.iter() {
        if let Some(path) = entry.path() {
            let status = match entry.status() {
                s if s.contains(git2::Status::WT_NEW) => "new",
                s if s.contains(git2::Status::WT_MODIFIED) => "modified",
                s if s.contains(git2::Status::WT_DELETED) => "deleted",
                _ => "unchanged",
            };
            
            file_statuses.push(FileStatus {
                path: path.to_string(),
                status: status.to_string(),
            });
        }
    }
    
    Ok(file_statuses)
}
