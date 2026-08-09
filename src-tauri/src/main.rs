#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Serialize, Deserialize, Debug)]
struct ProjectFile {
    schemaVersion: String,
    project: serde_json::Value,
    boards: Option<serde_json::Value>,
    exportedAt: String,
}

#[tauri::command]
fn get_app_info() -> serde_json::Value {
    serde_json::json!({
        "name": "Seedance Forge",
        "version": "3.1.0",
        "schemaVersion": "3.1.0"
    })
}

#[tauri::command]
fn save_project_file(path: String, content: String) -> Result<String, String> {
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(path)
}

#[tauri::command]
fn load_project_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_app_info, save_project_file, load_project_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
