-- Open a URL in a vertical iTerm2 split pane using the "Web Browser"
-- profile. Argument 1 = complete URL (`file://<abs-path>` for static
-- HTML/SVG, `http://localhost:<port>/...` for the runner's local server).
--
-- Architecture: AppleScript creates the split-pane (the only thing
-- iTerm2's AppleScript surface can do for Web-Browser sessions); the
-- actual page navigation is delegated to the iTerm2 Python API via
-- `navigate_iterm2_browser_pane.py`. This is the official path —
-- iTerm2's sdef has no `URL`, `browse to`, or `load url` AppleScript
-- command; `write text URL` only writes to a SHELL session and
-- silently no-ops on a Web-Browser session, which is why the original
-- downloads_dev/iterm2-preview skill never actually navigated.
--
-- Defense-in-depth check: if iTerm2 is not running we abort with a clear
-- error before tell-block coercion happens. The Python-side
-- detect_iterm2.py script is the primary check (Step 0 in SKILL.md AND
-- in scripts/amvcp-select.py's iterm-or-chrome dispatch); this AppleScript
-- guard is the safety net for direct osascript invocations.
on run argv
    if (count of argv) is 0 then
        error "open_preview.applescript: missing argument (complete URL — file:// or http://)"
    end if

    tell application "System Events"
        if not ((name of processes) contains "iTerm2") then
            error "iTerm2.app is not running — refusing to launch a preview pane"
        end if
    end tell

    -- Disable iTerm2's "Dim inactive split panes" globally so the Web Browser
    -- pane stays readable while the user types in the terminal pane. iTerm2
    -- has no per-pane or per-profile dim control — these preferences are
    -- global, so the side-effect is that ALL panes (not just the preview)
    -- will stop dimming on focus loss.
    --
    -- We set BOTH keys defensively. Empirically iTerm2 sometimes dims even
    -- when `DimInactiveSplitPanes` is false because the dim *amount* is
    -- non-zero — `SplitPaneDimmingAmount = 0.0` is the belt-and-braces fix.
    -- Both writes are idempotent (no-op when value is already what we want).
    -- The change is live: iTerm2 reads these at render time, no restart
    -- required. User can re-enable via Settings → Appearance → Dimming if
    -- they want the old behaviour back.
    do shell script "defaults write com.googlecode.iterm2 DimInactiveSplitPanes -bool false"
    do shell script "defaults write com.googlecode.iterm2 SplitPaneDimmingAmount -float 0.0"

    set pageURL to item 1 of argv

    -- Target vanilla iTerm.app explicitly via its bundle id so this script
    -- doesn't get routed to a fork (e.g. iTermAI.app, bundle
    -- com.googlecode.iterm2.iTermAI) when LaunchServices has multiple
    -- iTerm-named apps registered. The vanilla bundle id is unambiguous.
    tell application id "com.googlecode.iterm2"
        activate
        tell current window
            tell current tab
                tell current session
                    set newPane to split vertically with profile "Web Browser"
                end tell
                -- Capture the new session's UUID for the Python navigation
                -- step. iTerm2's `id` property on a session returns the same
                -- UUID the Python API uses in `app.get_session_by_id(...)`.
                set newSessionId to id of newPane
            end tell
        end tell
    end tell

    -- Hand off to the Python helper for actual page navigation. We pass
    -- the session UUID + URL + friendly name; the helper imports the iterm2
    -- module (auto-installed via the script's uv shebang) and calls
    -- `await session.async_load_url(url)` + `async_set_name("amvcp Preview")`.
    --
    -- IMPORTANT: this requires iTerm2's Python API to be enabled in
    -- Settings → General → Magic → "Enable Python API". The first run
    -- triggers a one-time consent prompt; the user can grant permanent
    -- permission for `amvcp` thereafter. detect_iterm2.py probes this
    -- prerequisite and refuses early with a clear setup message.
    --
    -- We don't error on Python failure — the pane is already open showing
    -- iTerm2 Browser's welcome page; the user can paste the URL into the
    -- URL bar manually. The stderr from the Python script is surfaced via
    -- the `do shell script` so the user sees `iterm2-nav: <reason>` if
    -- something went wrong.
    set scriptDir to (do shell script "dirname " & quoted form of (POSIX path of (path to me as text)))
    set navScript to scriptDir & "/navigate_iterm2_browser_pane.py"
    -- Invoke via `uv run --script` so the iterm2 module is auto-installed
    -- on first use (cached after that). The script itself uses a plain
    -- `#!/usr/bin/env python3` shebang because CPV strict mode flags
    -- non-Python shebangs as MINOR — the inline PEP 723 metadata block
    -- (# /// script ... # ///) tells uv which deps to fetch.
    try
        do shell script "uv run --quiet --with iterm2 --script " & quoted form of navScript & " " & quoted form of newSessionId & " " & quoted form of pageURL & " " & quoted form of "amvcp Preview"
    on error errMsg
        -- Surface the navigation error but DON'T abort — pane is open and
        -- usable; user can navigate manually if Python API setup is missing.
        log "open_preview.applescript: navigation failed (" & errMsg & ") — pane open, navigate manually via URL bar"
    end try
end run
