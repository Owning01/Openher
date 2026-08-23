//! Source control: operaciones git vía CLI para el panel SCM.
//! Puerto del módulo git de terax-ai (Apache-2.0, github.com/crynta/terax-ai)
//! adaptado a este proyecto: sin Tauri ni workspaces WSL, errores como String.

use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use serde::Serialize;

pub const DEFAULT_TIMEOUT_SECS: u64 = 30;
pub const NETWORK_TIMEOUT_SECS: u64 = 120;
pub const MAX_TIMEOUT_SECS: u64 = 180;
const MAX_OUTPUT_BYTES: usize = 2 * 1024 * 1024;
const MAX_FILE_BYTES: u64 = 2 * 1024 * 1024;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitRepoInfo {
    pub repo_root: String,
    pub branch: String,
    pub upstream: Option<String>,
    pub is_detached: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GitChangedFile {
    pub path: String,
    pub original_path: Option<String>,
    pub index_status: String,
    pub worktree_status: String,
    pub staged: bool,
    pub unstaged: bool,
    pub untracked: bool,
    pub status_label: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatusSnapshot {
    pub repo_root: String,
    pub branch: String,
    pub upstream: Option<String>,
    pub ahead: u32,
    pub behind: u32,
    pub is_detached: bool,
    pub truncated: bool,
    pub changed_files: Vec<GitChangedFile>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitPanelSnapshot {
    pub repo: Option<GitRepoInfo>,
    pub status: Option<GitStatusSnapshot>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitDiffResult {
    pub diff_text: String,
    pub truncated: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitDiffContentResult {
    pub original_content: String,
    pub modified_content: String,
    pub is_binary: bool,
    pub fallback_patch: String,
    pub truncated: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitCommitResult {
    pub commit_sha: String,
    pub summary: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitCommitFileChange {
    pub path: String,
    pub original_path: Option<String>,
    pub status: String,
    pub status_label: String,
    pub added: u32,
    pub removed: u32,
    pub is_binary: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitLogEntry {
    pub sha: String,
    pub short_sha: String,
    pub author: String,
    pub author_email: String,
    pub timestamp_secs: i64,
    pub parents: Vec<String>,
    pub subject: String,
    pub files_changed: u32,
    pub insertions: u32,
    pub deletions: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitPushResult {
    pub remote: Option<String>,
    pub branch: Option<String>,
    pub pushed: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GitBranchEntry {
    pub name: String,
    pub kind: String,
    pub worktree_path: Option<String>,
    pub is_head: bool,
    pub is_detached: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitBranchListResult {
    pub branches: Vec<GitBranchEntry>,
}

struct GitOutput {
    stdout: Vec<u8>,
    stderr: Vec<u8>,
    exit_code: Option<i32>,
    timed_out: bool,
    truncated: bool,
}

enum TextSource {
    Missing,
    Binary,
    Text(String),
}

impl TextSource {
    fn into_text(self) -> String {
        match self {
            TextSource::Text(t) => t,
            TextSource::Missing | TextSource::Binary => String::new(),
        }
    }
}

fn err(context: &str, detail: impl Into<String>) -> String {
    format!("{context}: {}", detail.into())
}

// ===== proceso git con timeout (std puro) =====

static GIT_OK: std::sync::OnceLock<()> = std::sync::OnceLock::new();

fn ensure_git_available() -> Result<(), String> {
    if GIT_OK.get().is_some() {
        return Ok(());
    }
    let out = run_git_uncached(None, ["--version"], 10)?;
    if out.timed_out || out.exit_code != Some(0) {
        return Err("git no está instalado o no responde".into());
    }
    let _ = GIT_OK.set(());
    Ok(())
}

struct GitCmd {
    cmd: Command,
}

fn build_git_command(cwd: Option<&str>, args: &[std::ffi::OsString]) -> GitCmd {
    let mut cmd = Command::new("git");
    cmd.args(args);
    if let Some(dir) = cwd.filter(|s| !s.is_empty()) {
        cmd.current_dir(Path::new(dir));
    }
    GitCmd { cmd }
}

fn drain<R: Read>(reader: &mut R, prealloc: usize) -> (Vec<u8>, bool) {
    let mut out: Vec<u8> = Vec::with_capacity(prealloc.min(MAX_OUTPUT_BYTES));
    let mut buf = [0u8; 16 * 1024];
    let mut truncated = false;
    loop {
        match reader.read(&mut buf) {
            Ok(0) => break,
            Ok(n) => {
                if out.len() >= MAX_OUTPUT_BYTES {
                    truncated = true;
                    continue;
                }
                let take = (MAX_OUTPUT_BYTES - out.len()).min(n);
                out.extend_from_slice(&buf[..take]);
                if take < n {
                    truncated = true;
                }
            }
            Err(_) => break,
        }
    }
    (out, truncated)
}

fn run_git<I, S>(cwd: Option<&str>, args: I, timeout_secs: u64) -> Result<GitOutput, String>
where
    I: IntoIterator<Item = S>,
    S: AsRef<std::ffi::OsStr>,
{
    run_git_uncached(
        cwd,
        args.into_iter().map(|a| a.as_ref().to_os_string()),
        timeout_secs.clamp(1, MAX_TIMEOUT_SECS),
    )
}

fn run_git_uncached<I, S>(
    cwd: Option<&str>,
    args: I,
    timeout_secs: u64,
) -> Result<GitOutput, String>
where
    I: IntoIterator<Item = S>,
    S: AsRef<std::ffi::OsStr>,
{
    let dur = Duration::from_secs(timeout_secs);
    let argv: Vec<std::ffi::OsString> = args
        .into_iter()
        .map(|a| a.as_ref().to_os_string())
        .collect();
    let mut builder = build_git_command(cwd, &argv);
    let cmd = &mut builder.cmd;
    cmd.env("GIT_TERMINAL_PROMPT", "0")
        .env("GIT_ASKPASS", "")
        .env("SSH_ASKPASS", "")
        .env("GIT_OPTIONAL_LOCKS", "0")
        .env("GCM_INTERACTIVE", "Never")
        .env("LC_ALL", "C")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(windows)]
    {
        // CREATE_NO_WINDOW: sin consola parpadeante en el shell desktop.
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags_compat(CREATE_NO_WINDOW);
    }

    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(e) => return Err(err("git spawn", e.to_string())),
    };
    let mut stdout_pipe = child.stdout.take().ok_or_else(|| "sin stdout".to_string())?;
    let mut stderr_pipe = child.stderr.take().ok_or_else(|| "sin stderr".to_string())?;

    let stdout_handle = thread::spawn(move || drain(&mut stdout_pipe, 64 * 1024));
    let stderr_handle = thread::spawn(move || drain(&mut stderr_pipe, 4 * 1024));

    let start = Instant::now();
    let mut timed_out = false;
    let mut exit_code: Option<i32> = None;
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                exit_code = status.code();
                break;
            }
            Ok(None) => {
                if start.elapsed() >= dur {
                    timed_out = true;
                    let _ = child.kill();
                    let _ = child.wait();
                    break;
                }
                thread::sleep(Duration::from_millis(25));
            }
            Err(e) => return Err(err("git wait", e.to_string())),
        }
    }

    let (stdout, stdout_truncated) = stdout_handle.join().unwrap_or((Vec::new(), false));
    let (stderr, _stderr_truncated) = stderr_handle.join().unwrap_or((Vec::new(), false));

    Ok(GitOutput {
        stdout,
        stderr,
        exit_code,
        timed_out,
        truncated: stdout_truncated,
    })
}

#[cfg(windows)]
trait CreationFlagsCompat {
    fn creation_flags_compat(&mut self, flags: u32);
}
#[cfg(windows)]
impl CreationFlagsCompat for Command {
    fn creation_flags_compat(&mut self, flags: u32) {
        use std::os::windows::process::CommandExt;
        self.creation_flags(flags);
    }
}

fn ensure_success(output: &GitOutput, context: &'static str) -> Result<(), String> {
    if output.timed_out {
        return Err(err(context, "timeout"));
    }
    if output.exit_code == Some(0) {
        return Ok(());
    }
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if let Some(e) = classify_auth_error(&stderr) {
        return Err(e);
    }
    let detail = if !stderr.is_empty() {
        stderr
    } else if !stdout.is_empty() {
        stdout
    } else {
        "error desconocido".into()
    };
    Err(err(context, detail))
}

fn classify_auth_error(stderr: &str) -> Option<String> {
    let lower = stderr.to_ascii_lowercase();
    if lower.contains("could not read username")
        || lower.contains("could not read password")
        || lower.contains("authentication failed")
        || lower.contains("permission denied (publickey)")
        || lower.contains("invalid credentials")
    {
        return Some(err("credenciales requeridas", stderr.lines().next().unwrap_or(stderr)));
    }
    if lower.contains("host key verification failed") {
        return Some(err("host key sin verificar", stderr.lines().next().unwrap_or(stderr)));
    }
    None
}

fn decode_text(bytes: Vec<u8>) -> TextSource {
    let sniff_len = bytes.len().min(8192);
    if bytes[..sniff_len].contains(&0) {
        return TextSource::Binary;
    }
    match String::from_utf8(bytes) {
        Ok(text) => TextSource::Text(text),
        Err(e) => TextSource::Text(String::from_utf8_lossy(&e.into_bytes()).into_owned()),
    }
}

fn git_show_text(repo_root: &str, spec: &str) -> Result<TextSource, String> {
    let output = run_git(
        Some(repo_root),
        ["show", "--no-textconv", spec],
        DEFAULT_TIMEOUT_SECS,
    )?;
    if output.timed_out {
        return Err(err("git show", "timeout"));
    }
    if output.exit_code != Some(0) {
        return Ok(TextSource::Missing);
    }
    Ok(decode_text(output.stdout))
}

fn git_stdout_line_opt<I, S>(cwd: &str, args: I) -> Result<Option<String>, String>
where
    I: IntoIterator<Item = S>,
    S: AsRef<std::ffi::OsStr>,
{
    let output = run_git(Some(cwd), args, DEFAULT_TIMEOUT_SECS)?;
    if output.timed_out {
        return Err(err("git command", "timeout"));
    }
    if output.exit_code != Some(0) {
        return Ok(None);
    }
    let stdout = std::str::from_utf8(&output.stdout).unwrap_or("");
    let line = stdout.lines().next().unwrap_or("").trim();
    if line.is_empty() {
        Ok(None)
    } else {
        Ok(Some(line.to_string()))
    }
}

fn git_stdout_lines<I, S>(cwd: &str, args: I) -> Result<Vec<String>, String>
where
    I: IntoIterator<Item = S>,
    S: AsRef<std::ffi::OsStr>,
{
    let output = run_git(Some(cwd), args, DEFAULT_TIMEOUT_SECS)?;
    if output.timed_out {
        return Err(err("git command", "timeout"));
    }
    if output.exit_code != Some(0) {
        return Ok(Vec::new());
    }
    let stdout = std::str::from_utf8(&output.stdout).unwrap_or("");
    Ok(stdout
        .lines()
        .map(|l| l.trim_end_matches('\r').to_string())
        .collect())
}

fn read_text_file(path: &Path) -> Result<TextSource, String> {
    let meta = match std::fs::symlink_metadata(path) {
        Ok(m) => m,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(TextSource::Missing),
        Err(e) => return Err(err("read", e.to_string())),
    };
    if meta.file_type().is_symlink() {
        return Ok(TextSource::Missing);
    }
    if !meta.is_file() {
        return Ok(TextSource::Missing);
    }
    let size = meta.len();
    if size > MAX_FILE_BYTES {
        return Err(err("archivo demasiado grande", path.display().to_string()));
    }
    let bytes = std::fs::read(path).map_err(|e| err("read", e.to_string()))?;
    Ok(decode_text(bytes))
}

// ===== utils de paths =====

fn canonical_dir(path: &str) -> Result<PathBuf, String> {
    let p = PathBuf::from(path);
    if !p.is_dir() {
        return Err(err("no es directorio", path.to_string()));
    }
    Ok(p.canonicalize().unwrap_or(p))
}

/// Resuelve `rel` dentro del repo; rechaza escape por `..` vía canonical.
fn resolve_within_repo(repo_root: &Path, rel: &str) -> Result<PathBuf, String> {
    let cleaned = rel.replace('\\', "/");
    let parts: Vec<&str> = cleaned
        .split('/')
        .filter(|c| !c.is_empty() && *c != ".")
        .collect();
    if parts.iter().any(|p| *p == "..") {
        return Err(err("path fuera del repo", rel.to_string()));
    }
    let abs = repo_root.join(parts.join("/"));
    let canonical = abs.canonicalize().unwrap_or(abs);
    let root_canonical = repo_root.canonicalize().unwrap_or_else(|_| repo_root.to_path_buf());
    if !canonical.starts_with(&root_canonical) {
        return Err(err("path fuera del repo", rel.to_string()));
    }
    Ok(canonical)
}

fn pathspec(repo_root: &Path, absolute: &Path) -> String {
    absolute
        .strip_prefix(repo_root)
        .map(|r| r.to_string_lossy().replace('\\', "/"))
        .unwrap_or_else(|_| absolute.to_string_lossy().replace('\\', "/"))
}

fn pathspec_from_input(repo_root: &Path, rel: &str) -> Result<String, String> {
    let resolved = resolve_within_repo(repo_root, rel)?;
    Ok(pathspec(repo_root, &resolved))
}

fn resolve_pathspecs(repo_root: &Path, paths: &[String]) -> Result<Vec<String>, String> {
    paths.iter().map(|p| pathspec_from_input(repo_root, p)).collect()
}

fn split_upstream(upstream: &str) -> (Option<String>, Option<String>) {
    match upstream.split_once('/') {
        Some((remote, branch)) => (Some(remote.to_string()), Some(branch.to_string())),
        None => (None, Some(upstream.to_string())),
    }
}

// ===== parser porcelain v2 (puerto verbatim de terax) =====

#[derive(Default)]
struct PorcelainV2 {
    branch: String,
    upstream: Option<String>,
    ahead: u32,
    behind: u32,
    is_detached: bool,
    files: Vec<GitChangedFile>,
}

fn parse_porcelain_v2(stdout: &str) -> PorcelainV2 {
    let mut out = PorcelainV2 {
        branch: "HEAD".into(),
        ..Default::default()
    };
    let mut tokens = stdout.split('\0').filter(|t| !t.is_empty());
    while let Some(tok) = tokens.next() {
        if let Some(rest) = tok.strip_prefix("# branch.head ") {
            out.branch = rest.to_string();
            out.is_detached = rest == "(detached)";
            continue;
        }
        if let Some(rest) = tok.strip_prefix("# branch.upstream ") {
            out.upstream = Some(rest.to_string());
            continue;
        }
        if let Some(rest) = tok.strip_prefix("# branch.ab ") {
            let mut parts = rest.split_ascii_whitespace();
            if let Some(a) = parts.next() {
                out.ahead = a.trim_start_matches('+').parse().unwrap_or(0);
            }
            if let Some(b) = parts.next() {
                out.behind = b.trim_start_matches('-').parse().unwrap_or(0);
            }
            continue;
        }
        if tok.starts_with("# ") {
            continue;
        }
        if let Some(rest) = tok.strip_prefix("1 ") {
            if let Some(file) = parse_ordinary(rest) {
                out.files.push(file);
            }
            continue;
        }
        if let Some(rest) = tok.strip_prefix("2 ") {
            let orig = tokens.next().unwrap_or("").to_string();
            if let Some(file) = parse_renamed(rest, orig) {
                out.files.push(file);
            }
            continue;
        }
        if let Some(rest) = tok.strip_prefix("u ") {
            if let Some(file) = parse_unmerged(rest) {
                out.files.push(file);
            }
            continue;
        }
        if let Some(rest) = tok.strip_prefix("? ") {
            out.files.push(make_file('?', '?', rest, None));
            continue;
        }
    }
    out
}

fn skip_fields(s: &str, n: usize) -> Option<&str> {
    let mut rest = s;
    for _ in 0..n {
        let idx = rest.find(' ')?;
        rest = &rest[idx + 1..];
    }
    Some(rest)
}

fn parse_ordinary(rest: &str) -> Option<GitChangedFile> {
    let xy = rest.get(..2)?;
    let path = skip_fields(rest, 7)?;
    let (i, w) = xy_chars(xy);
    Some(make_file(i, w, path, None))
}

fn parse_renamed(rest: &str, orig_path: String) -> Option<GitChangedFile> {
    let xy = rest.get(..2)?;
    let after = skip_fields(rest, 8)?;
    let (i, w) = xy_chars(xy);
    Some(make_file(i, w, after, Some(orig_path)))
}

fn parse_unmerged(rest: &str) -> Option<GitChangedFile> {
    let xy = rest.get(..2)?;
    let path = skip_fields(rest, 9)?;
    let (i, w) = xy_chars(xy);
    Some(make_file(i, w, path, None))
}

fn xy_chars(xy: &str) -> (char, char) {
    let mut it = xy.chars();
    let to_space = |c: char| if c == '.' { ' ' } else { c };
    (
        to_space(it.next().unwrap_or(' ')),
        to_space(it.next().unwrap_or(' ')),
    )
}

fn make_file(
    index_status: char,
    worktree_status: char,
    path: &str,
    original_path: Option<String>,
) -> GitChangedFile {
    GitChangedFile {
        path: path.to_string(),
        original_path,
        index_status: index_status.to_string(),
        worktree_status: worktree_status.to_string(),
        staged: is_staged(index_status, worktree_status),
        unstaged: is_unstaged(index_status, worktree_status),
        untracked: index_status == '?' && worktree_status == '?',
        status_label: status_label(index_status, worktree_status),
    }
}

fn is_staged(index_status: char, worktree_status: char) -> bool {
    index_status != ' ' && !(index_status == '?' && worktree_status == '?')
}

fn is_unstaged(index_status: char, worktree_status: char) -> bool {
    worktree_status != ' ' || (index_status == '?' && worktree_status == '?')
}

fn status_label(index_status: char, worktree_status: char) -> String {
    match (index_status, worktree_status) {
        ('?', '?') => "Untracked".into(),
        ('A', _) => "Added".into(),
        ('M', _) | (_, 'M') => "Modified".into(),
        ('D', _) | (_, 'D') => "Deleted".into(),
        ('R', _) | (_, 'R') => "Renamed".into(),
        ('C', _) | (_, 'C') => "Copied".into(),
        ('U', _) | (_, 'U') => "Unmerged".into(),
        _ => "Changed".into(),
    }
}

// ===== operaciones =====

pub fn panel_snapshot(cwd: &str) -> Result<GitPanelSnapshot, String> {
    let dir = canonical_dir(cwd)?;
    ensure_git_available()?;
    let root_line = git_stdout_line_opt(
        dir.to_string_lossy().as_ref(),
        ["rev-parse", "--show-toplevel"],
    )?;
    let Some(root_line) = root_line else {
        return Ok(GitPanelSnapshot { repo: None, status: None });
    };
    let root = canonical_dir(&root_line)?;
    let status = status_inner(&root)?;
    let repo = GitRepoInfo {
        repo_root: status.repo_root.clone(),
        branch: status.branch.clone(),
        upstream: status.upstream.clone(),
        is_detached: status.is_detached,
    };
    Ok(GitPanelSnapshot {
        repo: Some(repo),
        status: Some(status),
    })
}

pub fn status(repo_root: &str) -> Result<GitStatusSnapshot, String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    status_inner(&root)
}

fn status_inner(root: &Path) -> Result<GitStatusSnapshot, String> {
    let root_s = root.to_string_lossy().into_owned();
    let output = run_git(
        Some(&root_s),
        [
            "status",
            "--porcelain=v2",
            "--branch",
            "-z",
            "--untracked-files=all",
        ],
        DEFAULT_TIMEOUT_SECS,
    )?;
    ensure_success(&output, "git status falló")?;

    let stdout = std::str::from_utf8(&output.stdout).unwrap_or("");
    let parsed = parse_porcelain_v2(stdout);

    Ok(GitStatusSnapshot {
        repo_root: root_s,
        branch: parsed.branch,
        upstream: parsed.upstream,
        ahead: parsed.ahead,
        behind: parsed.behind,
        is_detached: parsed.is_detached,
        truncated: output.truncated,
        changed_files: parsed.files,
    })
}

pub fn diff(repo_root: &str, path: Option<&str>, staged: bool) -> Result<GitDiffResult, String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    diff_inner(&root, path, staged)
}

fn diff_inner(root: &Path, path: Option<&str>, staged: bool) -> Result<GitDiffResult, String> {
    let root_s = root.to_string_lossy().into_owned();
    let mut args: Vec<std::ffi::OsString> = vec!["diff".into(), "--no-ext-diff".into()];
    if staged {
        args.push("--cached".into());
    }
    let pathspec_v = match path.filter(|p| !p.is_empty()) {
        Some(p) => Some(pathspec_from_input(root, p)?),
        None => None,
    };
    if let Some(spec) = pathspec_v.as_ref() {
        args.push("--".into());
        args.push(spec.clone().into());
    }
    let output = run_git(Some(&root_s), args, DEFAULT_TIMEOUT_SECS)?;
    ensure_success(&output, "git diff falló")?;

    let diff_text = match String::from_utf8(output.stdout) {
        Ok(text) => text,
        Err(e) => String::from_utf8_lossy(&e.into_bytes()).into_owned(),
    };
    Ok(GitDiffResult {
        diff_text,
        truncated: output.truncated,
    })
}

pub fn diff_content(
    repo_root: &str,
    path: &str,
    staged: bool,
    original_path: Option<&str>,
) -> Result<GitDiffContentResult, String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    let root_s = root.to_string_lossy().into_owned();
    let worktree_path = resolve_within_repo(&root, path)?;
    let rel_path = pathspec(&root, &worktree_path);

    let original_rel = match original_path {
        Some(orig) if !orig.is_empty() => {
            let resolved = resolve_within_repo(&root, orig)?;
            Some(pathspec(&root, &resolved))
        }
        _ => None,
    };

    let original = if staged {
        let spec = original_rel.as_deref().unwrap_or(&rel_path);
        git_show_text(&root_s, &format!("HEAD:{spec}"))?
    } else {
        git_show_text(&root_s, &format!(":{rel_path}"))?
    };
    let modified = if staged {
        git_show_text(&root_s, &format!(":{rel_path}"))?
    } else {
        read_text_file(&worktree_path)?
    };
    let patch = diff_inner(&root, Some(&rel_path), staged)?;
    let is_binary =
        matches!(original, TextSource::Binary) || matches!(modified, TextSource::Binary);

    Ok(GitDiffContentResult {
        original_content: original.into_text(),
        modified_content: modified.into_text(),
        is_binary,
        fallback_patch: patch.diff_text,
        truncated: patch.truncated,
    })
}

pub fn stage(repo_root: &str, paths: &[String]) -> Result<(), String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    if paths.is_empty() {
        return Ok(());
    }
    let root_s = root.to_string_lossy().into_owned();
    let resolved = resolve_pathspecs(&root, paths)?;
    let mut args: Vec<std::ffi::OsString> = vec!["add".into(), "--".into()];
    for p in &resolved {
        args.push(p.clone().into());
    }
    let output = run_git(Some(&root_s), args, DEFAULT_TIMEOUT_SECS)?;
    ensure_success(&output, "git add falló")
}

pub fn unstage(repo_root: &str, paths: &[String]) -> Result<(), String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    if paths.is_empty() {
        return Ok(());
    }
    let root_s = root.to_string_lossy().into_owned();
    let resolved = resolve_pathspecs(&root, paths)?;
    let mut reset_args: Vec<std::ffi::OsString> = vec!["reset".into(), "HEAD".into(), "--".into()];
    for p in &resolved {
        reset_args.push(p.clone().into());
    }
    let output = run_git(Some(&root_s), reset_args, DEFAULT_TIMEOUT_SECS)?;
    if output.exit_code == Some(0) {
        return Ok(());
    }
    if !looks_like_no_head(&output) {
        return ensure_success(&output, "git reset falló");
    }
    // Repo sin commits aún: los archivos estaban recién agregados → rm --cached.
    let mut rm_args: Vec<std::ffi::OsString> = vec![
        "rm".into(),
        "--cached".into(),
        "-r".into(),
        "--".into(),
    ];
    for p in &resolved {
        rm_args.push(p.clone().into());
    }
    let output = run_git(Some(&root_s), rm_args, DEFAULT_TIMEOUT_SECS)?;
    ensure_success(&output, "git rm --cached falló")
}

fn looks_like_no_head(output: &GitOutput) -> bool {
    let stderr = String::from_utf8_lossy(&output.stderr).to_ascii_lowercase();
    stderr.contains("ambiguous argument 'head'")
        || stderr.contains("unknown revision")
        || stderr.contains("does not have any commits yet")
        || stderr.contains("bad revision 'head'")
}

pub fn discard(repo_root: &str, entries: &[(String, bool)]) -> Result<(), String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    if entries.is_empty() {
        return Ok(());
    }
    let root_s = root.to_string_lossy().into_owned();

    let mut tracked: Vec<String> = Vec::with_capacity(entries.len());
    let mut untracked: Vec<String> = Vec::new();
    for (path, is_untracked) in entries {
        let resolved = pathspec_from_input(&root, path)?;
        if *is_untracked {
            untracked.push(resolved);
        } else {
            tracked.push(resolved);
        }
    }

    if !tracked.is_empty() {
        let mut args: Vec<std::ffi::OsString> = vec!["restore".into(), "--worktree".into(), "--".into()];
        for p in &tracked {
            args.push(p.clone().into());
        }
        let output = run_git(Some(&root_s), args, DEFAULT_TIMEOUT_SECS)?;
        ensure_success(&output, "git restore falló")?;
    }

    if !untracked.is_empty() {
        let mut args: Vec<std::ffi::OsString> = vec!["clean".into(), "-f".into(), "-d".into(), "--".into()];
        for p in &untracked {
            args.push(p.clone().into());
        }
        let output = run_git(Some(&root_s), args, DEFAULT_TIMEOUT_SECS)?;
        ensure_success(&output, "git clean falló")?;
    }

    Ok(())
}

pub fn commit(repo_root: &str, message: &str) -> Result<GitCommitResult, String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    let root_s = root.to_string_lossy().into_owned();
    let trimmed = message.trim();
    if trimmed.is_empty() {
        return Err("mensaje de commit vacío".into());
    }

    let output = run_git(
        Some(&root_s),
        ["commit", "-m", trimmed],
        DEFAULT_TIMEOUT_SECS,
    )?;
    if output.exit_code != Some(0) && nothing_to_commit(&output) {
        return Err("git commit: nada staged".into());
    }
    ensure_success(&output, "git commit falló")?;

    let combined = git_stdout_lines(&root_s, ["show", "-s", "--format=%H%n%s", "HEAD"])?;
    let sha = combined.first().cloned().ok_or_else(|| "no se resolvió el SHA".to_string())?;
    let summary = combined.get(1).cloned().unwrap_or_default();

    Ok(GitCommitResult {
        commit_sha: sha,
        summary,
    })
}

pub fn push(repo_root: &str) -> Result<GitPushResult, String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    let root_s = root.to_string_lossy().into_owned();

    let upstream = git_stdout_line_opt(
        &root_s,
        ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
    )?;
    let Some(upstream) = upstream else {
        return Err("la rama no tiene upstream configurado".into());
    };

    let output = run_git(Some(&root_s), ["push"], NETWORK_TIMEOUT_SECS)?;
    ensure_success(&output, "git push falló")?;

    let (remote, branch) = split_upstream(&upstream);
    Ok(GitPushResult {
        remote,
        branch,
        pushed: true,
    })
}

pub fn fetch(repo_root: &str) -> Result<(), String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    let root_s = root.to_string_lossy().into_owned();
    let output = run_git(Some(&root_s), ["fetch", "--prune"], NETWORK_TIMEOUT_SECS)?;
    ensure_success(&output, "git fetch falló")
}

pub fn pull_ff_only(repo_root: &str) -> Result<(), String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    let root_s = root.to_string_lossy().into_owned();
    let output = run_git(Some(&root_s), ["pull", "--ff-only"], NETWORK_TIMEOUT_SECS)?;
    ensure_success(&output, "git pull --ff-only falló")
}

const LOG_FORMAT: &str = "%H%x1f%an%x1f%ae%x1f%at%x1f%P%x1f%s";
const MAX_LOG_LIMIT: u32 = 200;

pub fn log(
    repo_root: &str,
    limit: u32,
    before_sha: Option<&str>,
    search: Option<&str>,
) -> Result<Vec<GitLogEntry>, String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    let root_s = root.to_string_lossy().into_owned();
    let bounded = limit.clamp(1, MAX_LOG_LIMIT);
    let count_arg = format!("--max-count={bounded}");
    let format_arg = format!("--format={LOG_FORMAT}");
    let cursor = match before_sha {
        Some(sha) if !sha.is_empty() => {
            if !sha_is_safe(sha) {
                return Err("git log: cursor inválido".into());
            }
            Some(format!("{sha}^"))
        }
        _ => None,
    };
    let search_arg = search.map(|s| format!("--grep={s}")).filter(|s| !s.ends_with('='));
    let mut args: Vec<&std::ffi::OsStr> = vec![
        std::ffi::OsStr::new("log"),
        std::ffi::OsStr::new("--no-color"),
        std::ffi::OsStr::new("--shortstat"),
        std::ffi::OsStr::new(&count_arg),
        std::ffi::OsStr::new(&format_arg),
    ];
    if search_arg.is_some() {
        // grep sobre mensaje; mantener orden cronológico inverso estable.
        args.push(std::ffi::OsStr::new("--fixed-strings"));
        args.push(std::ffi::OsStr::new("--all-match"));
        args.push(std::ffi::OsStr::new(search_arg.as_ref().unwrap()));
    }
    if let Some(spec) = cursor.as_deref() {
        args.push(std::ffi::OsStr::new(spec));
    }
    let output = run_git(Some(&root_s), args, DEFAULT_TIMEOUT_SECS)?;
    if output.timed_out {
        return Err(err("git log", "timeout"));
    }
    if output.exit_code != Some(0) {
        let stderr = String::from_utf8_lossy(&output.stderr).to_ascii_lowercase();
        if stderr.contains("does not have any commits yet")
            || stderr.contains("bad default revision")
            || stderr.contains("unknown revision")
            || stderr.contains("ambiguous argument 'head'")
        {
            return Ok(Vec::new());
        }
        ensure_success(&output, "git log falló")?;
        return Ok(Vec::new());
    }
    let stdout = std::str::from_utf8(&output.stdout).unwrap_or("");
    let mut entries: Vec<GitLogEntry> = Vec::with_capacity(bounded as usize);
    for raw_line in stdout.lines() {
        let line = raw_line.trim_end_matches('\r');
        if line.is_empty() {
            continue;
        }
        if line.contains('\x1f') {
            let mut fields = line.splitn(6, '\x1f');
            let sha = fields.next().unwrap_or("").to_string();
            if !sha_is_safe(&sha) {
                continue;
            }
            let author = fields.next().unwrap_or("").to_string();
            let author_email = fields.next().unwrap_or("").to_string();
            let timestamp = fields.next().unwrap_or("0").parse::<i64>().unwrap_or(0);
            let parents_raw = fields.next().unwrap_or("");
            let parents: Vec<String> = parents_raw
                .split_ascii_whitespace()
                .map(|s| s.to_string())
                .collect();
            let subject = fields.next().unwrap_or("").to_string();
            let short_sha = sha.chars().take(7).collect::<String>();
            entries.push(GitLogEntry {
                sha,
                short_sha,
                author,
                author_email,
                timestamp_secs: timestamp,
                parents,
                subject,
                files_changed: 0,
                insertions: 0,
                deletions: 0,
            });
            continue;
        }
        if let Some(current) = entries.last_mut() {
            if line.contains("file changed") || line.contains("files changed") {
                let (files, ins, del) = parse_shortstat(line);
                current.files_changed = files;
                current.insertions = ins;
                current.deletions = del;
            }
        }
    }
    Ok(entries)
}

fn parse_shortstat(tail: &str) -> (u32, u32, u32) {
    for line in tail.lines() {
        let trimmed = line.trim();
        if !(trimmed.contains("file changed") || trimmed.contains("files changed")) {
            continue;
        }
        let mut files = 0u32;
        let mut ins = 0u32;
        let mut del = 0u32;
        for part in trimmed.split(',') {
            let part = part.trim();
            let num_str = part.split_ascii_whitespace().next().unwrap_or("0");
            let n: u32 = num_str.parse().unwrap_or(0);
            if part.contains("file") {
                files = n;
            } else if part.contains("insertion") {
                ins = n;
            } else if part.contains("deletion") {
                del = n;
            }
        }
        return (files, ins, del);
    }
    (0, 0, 0)
}

fn sha_is_safe(sha: &str) -> bool {
    !sha.is_empty() && sha.len() <= 64 && sha.chars().all(|c| c.is_ascii_hexdigit())
}

pub fn show_commit_diff(repo_root: &str, sha: &str) -> Result<GitDiffResult, String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    let root_s = root.to_string_lossy().into_owned();
    if !sha_is_safe(sha) {
        return Err("git show: identificador de commit inválido".into());
    }
    let output = run_git(
        Some(&root_s),
        [
            "show",
            "--no-color",
            "--no-ext-diff",
            "--patch-with-stat",
            sha,
            "--",
        ],
        DEFAULT_TIMEOUT_SECS,
    )?;
    ensure_success(&output, "git show falló")?;
    let diff_text = match String::from_utf8(output.stdout) {
        Ok(text) => text,
        Err(e) => String::from_utf8_lossy(&e.into_bytes()).into_owned(),
    };
    Ok(GitDiffResult {
        diff_text,
        truncated: output.truncated,
    })
}

pub fn commit_files(repo_root: &str, sha: &str) -> Result<Vec<GitCommitFileChange>, String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    let root_s = root.to_string_lossy().into_owned();
    if !sha_is_safe(sha) {
        return Err("git diff-tree: SHA inválido".into());
    }

    let output = run_git(
        Some(&root_s),
        [
            "diff-tree",
            "--no-commit-id",
            "-r",
            "-z",
            "--name-status",
            "--numstat",
            sha,
        ],
        DEFAULT_TIMEOUT_SECS,
    )?;
    ensure_success(&output, "git diff-tree falló")?;

    let (name_status_bytes, numstat_bytes) = split_name_status_numstat(&output.stdout);
    let mut files = parse_diff_tree_name_status(name_status_bytes);
    apply_numstat(&mut files, numstat_bytes);
    Ok(files)
}

/// Diff de un archivo dentro de un commit (para el history pane).
pub fn commit_file_diff(
    repo_root: &str,
    sha: &str,
    path: &str,
    original_path: Option<&str>,
) -> Result<GitDiffContentResult, String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    let root_s = root.to_string_lossy().into_owned();
    if !sha_is_safe(sha) {
        return Err("git show: SHA inválido".into());
    }
    let resolved = resolve_within_repo(&root, path)?;
    let rel = resolved
        .strip_prefix(&root)
        .map(|p| p.to_string_lossy().replace('\\', "/"))
        .unwrap_or_else(|_| path.replace('\\', "/"));

    let original_rel = match original_path {
        Some(orig) if !orig.is_empty() => {
            let resolved_orig = resolve_within_repo(&root, orig)?;
            resolved_orig
                .strip_prefix(&root)
                .map(|p| p.to_string_lossy().replace('\\', "/"))
                .unwrap_or_else(|_| orig.replace('\\', "/"))
        }
        _ => rel.clone(),
    };

    let parent = git_stdout_line_opt(&root_s, ["rev-parse", &format!("{sha}^")])?;
    let original = match parent.as_deref() {
        Some(p) => git_show_text(&root_s, &format!("{p}:{original_rel}"))?,
        None => TextSource::Missing,
    };
    let modified = git_show_text(&root_s, &format!("{sha}:{rel}"))?;

    let mut diff_args: Vec<std::ffi::OsString> = vec![
        "show".into(),
        "--no-color".into(),
        "--no-ext-diff".into(),
        "--format=".into(),
        "-m".into(),
        "--first-parent".into(),
        sha.into(),
        "--".into(),
    ];
    diff_args.push(rel.clone().into());
    if original_rel != rel {
        diff_args.push(original_rel.clone().into());
    }
    let patch_output = run_git(Some(&root_s), diff_args, DEFAULT_TIMEOUT_SECS)?;
    ensure_success(&patch_output, "git show <commit> -- <path> falló")?;
    let patch_text = match String::from_utf8(patch_output.stdout) {
        Ok(text) => text,
        Err(e) => String::from_utf8_lossy(&e.into_bytes()).into_owned(),
    };

    let is_binary =
        matches!(original, TextSource::Binary) || matches!(modified, TextSource::Binary);

    Ok(GitDiffContentResult {
        original_content: original.into_text(),
        modified_content: modified.into_text(),
        is_binary,
        fallback_patch: patch_text,
        truncated: patch_output.truncated,
    })
}

fn split_name_status_numstat(bytes: &[u8]) -> (&[u8], &[u8]) {
    let s = std::str::from_utf8(bytes).unwrap_or("");
    let mut offset = 0usize;
    let mut split_at = bytes.len();
    for tok in s.split('\0') {
        let start = offset;
        offset += tok.len() + 1;
        if tok.contains('\t') {
            split_at = start;
            break;
        }
    }
    (&bytes[..split_at], &bytes[split_at.min(bytes.len())..])
}

fn parse_diff_tree_name_status(bytes: &[u8]) -> Vec<GitCommitFileChange> {
    let s = std::str::from_utf8(bytes).unwrap_or("");
    let mut tokens = s.split('\0').filter(|t| !t.is_empty());
    let mut files: Vec<GitCommitFileChange> = Vec::new();
    while let Some(status_tok) = tokens.next() {
        let status_char = status_tok.chars().next().unwrap_or(' ');
        if status_char == 'R' || status_char == 'C' {
            let original = match tokens.next() {
                Some(v) => v.to_string(),
                None => break,
            };
            let new_path = match tokens.next() {
                Some(v) => v.to_string(),
                None => break,
            };
            files.push(GitCommitFileChange {
                path: new_path,
                original_path: Some(original),
                status: status_char.to_string(),
                status_label: status_label_for(status_char),
                added: 0,
                removed: 0,
                is_binary: false,
            });
        } else {
            let path = match tokens.next() {
                Some(v) => v.to_string(),
                None => break,
            };
            files.push(GitCommitFileChange {
                path,
                original_path: None,
                status: status_char.to_string(),
                status_label: status_label_for(status_char),
                added: 0,
                removed: 0,
                is_binary: false,
            });
        }
    }
    files
}

fn apply_numstat(files: &mut [GitCommitFileChange], bytes: &[u8]) {
    let s = std::str::from_utf8(bytes).unwrap_or("");
    let tokens: Vec<&str> = s.split('\0').filter(|t| !t.is_empty()).collect();
    let mut idx = 0;
    while idx < tokens.len() {
        let header = tokens[idx];
        idx += 1;
        let mut cols = header.splitn(3, '\t');
        let added_raw = cols.next().unwrap_or("0");
        let removed_raw = cols.next().unwrap_or("0");
        let inline_path = cols.next().unwrap_or("");
        let is_binary = added_raw == "-" && removed_raw == "-";
        let added: u32 = if is_binary { 0 } else { added_raw.parse().unwrap_or(0) };
        let removed: u32 = if is_binary { 0 } else { removed_raw.parse().unwrap_or(0) };

        let (path, original) = if inline_path.is_empty() {
            let original = tokens.get(idx).map(|s| s.to_string()).unwrap_or_default();
            idx += 1;
            let new_path = tokens.get(idx).map(|s| s.to_string()).unwrap_or_default();
            idx += 1;
            (new_path, Some(original))
        } else {
            (inline_path.to_string(), None)
        };

        if path.is_empty() {
            continue;
        }
        if let Some(file) = files.iter_mut().find(|f| f.path == path) {
            file.added = added;
            file.removed = removed;
            file.is_binary = is_binary;
            if file.original_path.is_none() {
                if let Some(orig) = original {
                    if !orig.is_empty() && orig != file.path {
                        file.original_path = Some(orig);
                    }
                }
            }
        }
    }
}

fn status_label_for(c: char) -> String {
    match c {
        'A' => "Added".into(),
        'M' => "Modified".into(),
        'D' => "Deleted".into(),
        'R' => "Renamed".into(),
        'C' => "Copied".into(),
        'T' => "Type changed".into(),
        'U' => "Unmerged".into(),
        _ => format!("Status {c}"),
    }
}

pub fn remote_url(repo_root: &str, name: &str) -> Result<Option<String>, String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    let root_s = root.to_string_lossy().into_owned();
    if name.is_empty() || name.len() > 64 || !name.chars().all(is_remote_name_char) {
        return Ok(None);
    }
    git_stdout_line_opt(&root_s, ["config", "--get", &format!("remote.{name}.url")])
}

fn is_remote_name_char(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.'
}

fn nothing_to_commit(output: &GitOutput) -> bool {
    let stderr = String::from_utf8_lossy(&output.stderr).to_ascii_lowercase();
    let stdout = String::from_utf8_lossy(&output.stdout).to_ascii_lowercase();
    stderr.contains("nothing to commit") || stdout.contains("nothing to commit")
}

pub fn list_branches(repo_root: &str) -> Result<GitBranchListResult, String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    let root_s = root.to_string_lossy().into_owned();
    let mut branches: Vec<GitBranchEntry> = Vec::new();

    let current_branch = git_stdout_line_opt(&root_s, ["rev-parse", "--abbrev-ref", "HEAD"]).ok().flatten();
    let is_detached_head = current_branch.as_deref() == Some("HEAD");

    if let Ok(lines) = git_stdout_lines(&root_s, ["branch", "--format=%(refname:short)%00%(HEAD)"]) {
        for line in &lines {
            let mut parts = line.split('\0');
            let name = parts.next().unwrap_or("").to_string();
            let head_marker = parts.next().unwrap_or("");
            let is_head = head_marker == "*";
            if !name.is_empty() {
                branches.push(GitBranchEntry {
                    name,
                    kind: "local".into(),
                    worktree_path: None,
                    is_head,
                    is_detached: is_head && is_detached_head,
                });
            }
        }
    }

    if let Ok(lines) = git_stdout_lines(&root_s, ["worktree", "list", "--porcelain"]) {
        let mut current_worktree: Option<String> = None;
        let mut worktree_branch: Option<String> = None;
        let mut worktree_bare = false;
        let mut head_sha: Option<String> = None;
        for line in &lines {
            if let Some(rest) = line.strip_prefix("worktree ") {
                if let Some(wt_path) = current_worktree.take() {
                    if !worktree_bare {
                        push_worktree(&mut branches, wt_path, worktree_branch.take(), head_sha.take());
                    }
                }
                current_worktree = Some(rest.trim().to_string());
                worktree_branch = None;
                worktree_bare = false;
                head_sha = None;
            } else if let Some(rest) = line.strip_prefix("HEAD ") {
                head_sha = Some(rest.trim().to_string());
            } else if let Some(rest) = line.strip_prefix("branch ") {
                let raw = rest.trim();
                worktree_branch = Some(raw.strip_prefix("refs/heads/").unwrap_or(raw).to_string());
            } else if line.starts_with("bare") {
                worktree_bare = true;
            }
        }
        if let Some(wt_path) = current_worktree.take() {
            if !worktree_bare {
                push_worktree(&mut branches, wt_path, worktree_branch.take(), head_sha.take());
            }
        }
    }

    let mut seen: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    let mut deduped: Vec<GitBranchEntry> = Vec::with_capacity(branches.len());
    for b in branches {
        if let Some(&existing_idx) = seen.get(&b.name) {
            let existing = &deduped[existing_idx];
            let should_replace = b.kind == "worktree"
                && existing.kind == "local"
                && existing.worktree_path.is_none()
                && !existing.is_head;
            if should_replace {
                let is_head = existing.is_head || b.is_head;
                deduped[existing_idx] = GitBranchEntry {
                    is_head,
                    ..b
                };
            } else if b.is_head && !existing.is_head {
                let mut updated = deduped[existing_idx].clone();
                updated.is_head = true;
                deduped[existing_idx] = updated;
            }
        } else {
            seen.insert(b.name.clone(), deduped.len());
            deduped.push(b);
        }
    }

    deduped.sort_by(|a, b| {
        let kind_ord = |k: &str| if k == "local" { 0u8 } else { 1u8 };
        kind_ord(&a.kind)
            .cmp(&kind_ord(&b.kind))
            .then_with(|| a.name.cmp(&b.name))
    });

    Ok(GitBranchListResult { branches: deduped })
}

fn push_worktree(
    branches: &mut Vec<GitBranchEntry>,
    path: String,
    branch: Option<String>,
    head_sha: Option<String>,
) {
    let name = if let Some(ref b) = branch {
        b.clone()
    } else if let Some(ref sha) = head_sha {
        let short = if sha.len() >= 7 { &sha[..7] } else { sha.as_str() };
        format!("(detached @ {})", short)
    } else {
        return;
    };
    branches.push(GitBranchEntry {
        name,
        kind: "worktree".into(),
        worktree_path: Some(path),
        is_head: false,
        is_detached: branch.is_none(),
    });
}

pub fn checkout_branch(repo_root: &str, branch_name: &str) -> Result<(), String> {
    let root = canonical_dir(repo_root)?;
    ensure_git_available()?;
    let root_s = root.to_string_lossy().into_owned();
    if branch_name.starts_with('-') || branch_name.is_empty() {
        return Err(err("nombre de rama inválido", branch_name.to_string()));
    }
    let output = run_git(Some(&root_s), ["checkout", branch_name], DEFAULT_TIMEOUT_SECS)?;
    ensure_success(&output, "git checkout falló")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn porcelain_v2_parses_branch_and_files() {
        let stdout = concat!(
            "# branch.oid abc123\0",
            "# branch.head main\0",
            "# branch.upstream origin/main\0",
            "# branch.ab +2 -1\0",
            "1 .M N... 100644 100644 100644 abc def src/a.rs\0",
            "2 R. N... 100644 100644 100644 abc def R100 src/new.rs\0src/old.rs\0",
            "? src/untracked.rs\0",
        );
        let parsed = parse_porcelain_v2(stdout);
        assert_eq!(parsed.branch, "main");
        assert_eq!(parsed.upstream.as_deref(), Some("origin/main"));
        assert_eq!(parsed.ahead, 2);
        assert_eq!(parsed.behind, 1);
        assert!(!parsed.is_detached);
        assert_eq!(parsed.files.len(), 3);
        assert!(parsed.files[0].unstaged);
        assert_eq!(parsed.files[1].original_path.as_deref(), Some("src/old.rs"));
        assert!(parsed.files[1].staged);
        assert!(parsed.files[2].untracked);
    }

    #[test]
    fn handles_detached_head() {
        let parsed = parse_porcelain_v2("# branch.oid abc\0# branch.head (detached)\0");
        assert!(parsed.is_detached);
        assert_eq!(parsed.branch, "(detached)");
    }

    #[test]
    fn preserves_paths_with_spaces() {
        let ordinary = format!("1 .M N... 100644 100644 100644 abc def src/my file name.rs\0");
        let parsed = parse_porcelain_v2(&ordinary);
        assert_eq!(parsed.files.len(), 1);
        assert_eq!(parsed.files[0].path, "src/my file name.rs");
    }

    #[test]
    fn rename_consumes_orig_token_without_eating_next_entry() {
        let ordinary = "1 .M N... 100644 100644 100644 abc def after.rs\0";
        let stdout = format!("2 R. N... 100644 100644 100644 abc def R100 new.rs\0old.rs\0{ordinary}");
        let parsed = parse_porcelain_v2(&stdout);
        assert_eq!(parsed.files.len(), 2);
        assert_eq!(parsed.files[0].status_label, "Renamed");
        assert!(parsed.files[1].original_path.is_none());
    }

    #[test]
    fn unmerged_entry_parsed_and_labeled() {
        let parsed =
            parse_porcelain_v2("u UU N... 100644 100644 100644 100644 a b c conflict.rs\0");
        assert_eq!(parsed.files.len(), 1);
        assert_eq!(parsed.files[0].status_label, "Unmerged");
        assert!(parsed.files[0].staged);
        assert!(parsed.files[0].unstaged);
    }

    #[test]
    fn staged_unstaged_untracked_matrix() {
        let cases = [
            (".M", false, true, false, "Modified"),
            ("M.", true, false, false, "Modified"),
            ("MM", true, true, false, "Modified"),
            ("A.", true, false, false, "Added"),
            ("D.", true, false, false, "Deleted"),
            (".D", false, true, false, "Deleted"),
        ];
        for (xy, staged, unstaged, untracked, label) in cases {
            let ordinary = format!("1 {xy} N... 100644 100644 100644 abc def f.rs\0");
            let parsed = parse_porcelain_v2(&ordinary);
            let f = &parsed.files[0];
            assert_eq!(f.staged, staged, "staged for {xy}");
            assert_eq!(f.unstaged, unstaged, "unstaged for {xy}");
            assert_eq!(f.untracked, untracked, "untracked for {xy}");
            assert_eq!(f.status_label, label, "label for {xy}");
        }
    }

    #[test]
    fn malformed_entries_are_skipped_without_panic() {
        let parsed = parse_porcelain_v2("1 .M\0? ok.rs\0");
        assert_eq!(parsed.files.len(), 1);
        assert_eq!(parsed.files[0].path, "ok.rs");
    }

    #[test]
    fn sha_is_safe_rejects_injection() {
        assert!(sha_is_safe("abc123"));
        assert!(sha_is_safe(&"f".repeat(64)));
        assert!(!sha_is_safe(""));
        assert!(!sha_is_safe("abcg"));
        assert!(!sha_is_safe(";rm -rf /"));
        assert!(!sha_is_safe(&"a".repeat(65)));
    }

    #[test]
    fn parse_shortstat_pulls_three_counts() {
        let line = " 5 files changed, 12 insertions(+), 3 deletions(-)";
        assert_eq!(parse_shortstat(line), (5, 12, 3));
    }

    #[test]
    fn parse_shortstat_handles_singular_file() {
        assert_eq!(parse_shortstat(" 1 file changed, 1 insertion(+)"), (1, 1, 0));
        assert_eq!(parse_shortstat("no stat here"), (0, 0, 0));
    }

    #[test]
    fn looks_like_no_head_recognizes_phrases() {
        let mk = |s: &str| GitOutput {
            stdout: Vec::new(),
            stderr: s.as_bytes().to_vec(),
            exit_code: Some(128),
            timed_out: false,
            truncated: false,
        };
        assert!(looks_like_no_head(&mk(
            "fatal: ambiguous argument 'HEAD': unknown revision"
        )));
        assert!(looks_like_no_head(&mk(
            "fatal: your current branch 'main' does not have any commits yet"
        )));
        assert!(!looks_like_no_head(&mk("fatal: pathspec did not match")));
    }

    #[test]
    fn split_upstream_remote_and_branch() {
        assert_eq!(
            split_upstream("origin/main"),
            (Some("origin".into()), Some("main".into()))
        );
        assert_eq!(split_upstream("main"), (None, Some("main".into())));
    }

    #[test]
    fn resolve_within_repo_blocks_escape() {
        let tmp = std::env::temp_dir().join("gitx_test_escape");
        let inner = tmp.join("repo");
        let _ = std::fs::create_dir_all(&inner);
        let root = inner.canonicalize().unwrap_or(inner.clone());
        assert!(resolve_within_repo(&root, "../outside.txt").is_err());
        assert!(resolve_within_repo(&root, "sub/dir/file.txt").is_ok());
        let _ = std::fs::remove_dir_all(&tmp);
    }
}
