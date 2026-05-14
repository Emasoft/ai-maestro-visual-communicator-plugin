-- Open a URL in a vertical iTerm2 split pane using the "Web Browser"
-- profile.
--
-- USAGE:
--     osascript open_preview.applescript <URL> [<caller-session-UUID>]
--
-- Argument 1 = complete URL (`file://<abs-path>` for static HTML/SVG,
-- `http://localhost:<port>/...` for the runner's local server).
--
-- Argument 2 (optional but STRONGLY RECOMMENDED) = the calling shell's
-- iTerm2 session UUID. iTerm2 exports it on every shell session as
-- `$ITERM_SESSION_ID = w<W>t<T>p<P>:<UUID>`; the caller should strip the
-- `wXtXpX:` prefix and pass just the UUID, e.g. in bash:
--
--     osascript open_preview.applescript "$URL" "${ITERM_SESSION_ID##*:}"
--
-- When the UUID is supplied we walk every iTerm window+tab+session and
-- split the EXACT session that matches — guaranteeing the preview pane
-- lands in the caller's own tab, not in whatever tab the user happens
-- to have focused at the moment of dispatch (the original bug: a script
-- called from a backgrounded Claude session opened the pane in a
-- different tab where the user was actively typing).
--
-- When the UUID is omitted (legacy/manual osascript invocation) we fall
-- back to splitting the current session of the current tab of the
-- current window, with a stderr warning so the silent-tab-mismatch
-- failure mode is at least loud when it happens.
--
-- Architecture: AppleScript creates the split-pane (the only thing
-- iTerm2's AppleScript surface can do for Web-Browser sessions); the
-- actual page navigation is delegated to the iTerm2 Python API via
-- `navigate_iterm2_browser_pane.py`. iTerm2's sdef has no `URL`,
-- `browse to`, or `load url` AppleScript command; `write text URL`
-- only writes to a SHELL session and silently no-ops on a Web-Browser
-- session, which is why the original downloads_dev/iterm2-preview
-- skill never actually navigated.
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
    do shell script "defaults write com.googlecode.iterm2 DimInactiveSplitPanes -bool false"
    do shell script "defaults write com.googlecode.iterm2 SplitPaneDimmingAmount -float 0.0"

    set pageURL to item 1 of argv
    set callerUUID to ""
    if (count of argv) >= 2 then
        set callerUUID to item 2 of argv
    end if

    -- Target vanilla iTerm.app explicitly via its bundle id so this script
    -- doesn't get routed to a fork (e.g. iTermAI.app, bundle
    -- com.googlecode.iterm2.iTermAI) when LaunchServices has multiple
    -- iTerm-named apps registered. The vanilla bundle id is unambiguous.
    tell application id "com.googlecode.iterm2"
        activate

        -- Locate the caller's session by UUID. iTerm2 sets a session
        -- `id` property equal to its UUID (matching `$ITERM_SESSION_ID`
        -- after the `wXtXpX:` prefix is stripped). We iterate every
        -- window's tabs' sessions to find the one whose id matches.
        -- Iteration is fast (typical iTerm: <10 windows × <20 tabs × <5
        -- sessions = <1000 nodes) and unambiguous — no race against the
        -- user changing focus mid-call.
        set targetSession to missing value
        set targetTab to missing value
        if callerUUID is not "" then
            repeat with w in windows
                repeat with t in tabs of w
                    repeat with s in sessions of t
                        try
                            if (id of s as string) is callerUUID then
                                set targetSession to s
                                set targetTab to t
                                exit repeat
                            end if
                        end try
                    end repeat
                    if targetSession is not missing value then exit repeat
                end repeat
                if targetSession is not missing value then exit repeat
            end repeat
        end if

        -- Fallback: caller didn't pass UUID, OR the UUID didn't match
        -- any live session (caller's tab/window was closed since
        -- launch). Use current-session-of-current-tab-of-current-window
        -- with a log line so the user can debug "why did the pane
        -- appear in tab X instead of tab Y".
        if targetSession is missing value then
            if callerUUID is "" then
                log "open_preview.applescript: no caller UUID supplied — splitting CURRENT session (may land in wrong tab if focus changed)"
            else
                log "open_preview.applescript: caller UUID " & callerUUID & " not found — falling back to CURRENT session"
            end if
            set targetTab to current tab of current window
            set targetSession to current session of targetTab
        end if

        -- ── GLOBAL SAFEGUARD: ONE PREVIEW PANE PER SHELL ────────────────
        -- Before splitting, close any existing Web Browser sessions
        -- (sessions with `tty = missing value`) in the caller\'s tab.
        -- Without this, repeated open_preview calls from the same shell
        -- stack panes side-by-side until the tab is unusable. Identifying
        -- preview panes by absence-of-tty is the same heuristic
        -- close_preview.applescript uses — shell sessions ALWAYS have a
        -- /dev/ttysNN, Web Browser sessions never do.
        tell targetTab
            set staleSessions to {}
            repeat with s in sessions
                try
                    set sTty to tty of s
                    if sTty is missing value then
                        set end of staleSessions to s
                    end if
                end try
            end repeat
            repeat with s in staleSessions
                try
                    tell s to close
                end try
            end repeat
        end tell

        tell targetSession
            set newPane to split vertically with profile "Web Browser"
        end tell
        -- Capture the new session's UUID for the Python navigation step.
        set newSessionId to id of newPane
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
    try
        do shell script "uv run --quiet --with iterm2 --script " & quoted form of navScript & " " & quoted form of newSessionId & " " & quoted form of pageURL & " " & quoted form of "amvcp Preview"
    on error errMsg
        log "open_preview.applescript: navigation failed (" & errMsg & ") — pane open, navigate manually via URL bar"
    end try

    -- Return the new session UUID as the script's stdout. The runner
    -- (`scripts/amvcp-select.py:launch_iterm2_split`) captures this and
    -- passes it to `close_iterm2_pane()` on selection received, so the
    -- preview pane auto-closes when the user clicks Submit/Exit.
    return newSessionId
end run
