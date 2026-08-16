//! Feed de updates: GitHub API (releases/commits) + X best-effort
//! (r.jina.ai sobre el perfil). Cacheado en data/cache.

use std::time::Duration;

use crate::state::{cache_dir, now_ms, AppState};

const USER_AGENT: &str = "opencode-desktop/0.1";

fn get_json(url: &str) -> Option<serde_json::Value> {
    let resp = ureq::get(url)
        .set("User-Agent", USER_AGENT)
        .timeout(Duration::from_secs(12))
        .call()
        .ok()?;
    let text = resp.into_string().ok()?;
    serde_json::from_str(&text).ok()
}

pub fn github(state: &AppState) -> serde_json::Value {
    let repos = state.config.read().unwrap().github_repos.clone();
    let mut out = Vec::new();
    for repo in repos {
        let releases = get_json(&format!("https://api.github.com/repos/{repo}/releases?per_page=5"));
        let commits =
            get_json(&format!("https://api.github.com/repos/{repo}/commits?per_page=10"));
        let rel = releases
            .as_ref()
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .map(|r| {
                        serde_json::json!({
                            "tag": r["tag_name"].as_str().unwrap_or(""),
                            "name": r["name"].as_str().unwrap_or(""),
                            "date": r["published_at"].as_str().unwrap_or(""),
                            "body": r["body"].as_str().unwrap_or("").chars().take(600).collect::<String>(),
                            "url": r["html_url"].as_str().unwrap_or(""),
                        })
                    })
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let com = commits
            .as_ref()
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .map(|c| {
                        serde_json::json!({
                            "sha": c["sha"].as_str().unwrap_or("").chars().take(7).collect::<String>(),
                            "message": c["commit"]["message"].as_str().unwrap_or("").chars().take(200).collect::<String>(),
                            "date": c["commit"]["author"]["date"].as_str().unwrap_or(""),
                            "author": c["commit"]["author"]["name"].as_str().unwrap_or(""),
                            "url": c["html_url"].as_str().unwrap_or(""),
                        })
                    })
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        out.push(serde_json::json!({ "repo": repo, "releases": rel, "commits": com }));
    }
    serde_json::json!({ "github": out })
}

pub fn x_feed(state: &AppState) -> serde_json::Value {
    let handles = state.config.read().unwrap().x_handles.clone();
    let mut out = Vec::new();
    for handle in handles {
        let url = format!("https://r.jina.ai/https://x.com/{handle}");
        match ureq::get(&url)
            .set("User-Agent", USER_AGENT)
            .timeout(Duration::from_secs(20))
            .call()
        {
            Ok(resp) => {
                let text = resp.into_string().unwrap_or_default();
                let lines: Vec<String> = text
                    .lines()
                    .map(|l| l.trim().to_string())
                    .filter(|l| !l.is_empty() && l.len() > 4)
                    .take(80)
                    .collect();
                out.push(serde_json::json!({ "handle": handle, "lines": lines }));
            }
            Err(_) => {
                out.push(serde_json::json!({ "handle": handle, "lines": [], "error": "no disponible" }));
            }
        }
    }
    serde_json::json!({ "x": out })
}

pub fn build(state: &AppState, force: bool) -> serde_json::Value {
    let cache_file = cache_dir().join("updates.json");
    if !force {
        if let Ok(raw) = std::fs::read_to_string(&cache_file) {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&raw) {
                let age = now_ms().saturating_sub(v["fetched_at"].as_u64().unwrap_or(0));
                if age < 60 * 60 * 1000 {
                    return v;
                }
            }
        }
    }
    let gh = github(state);
    let x = x_feed(state);
    let mut payload = serde_json::json!({
        "fetched_at": now_ms(),
        "github": gh["github"],
        "x": x["x"],
    });
    // Merge de github multi-repo.
    payload["github"] = gh["github"].clone();
    let _ = std::fs::create_dir_all(cache_dir());
    let _ = std::fs::write(&cache_file, payload.to_string());
    payload
}