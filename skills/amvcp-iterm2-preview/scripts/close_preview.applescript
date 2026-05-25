-- Close every Web Browser preview pane in the current iTerm2 tab while
-- keeping every shell session (including the user's Claude Code terminal)
-- intact.
--
-- The original implementation closed "every session that isn't the current
-- session" — but iTerm2 often auto-focuses a newly-created split, so
-- `current session` = the Web Browser pane and the loop wrongly tried to
-- close the user's terminal. We now identify preview panes by the absence
-- of a tty: shell sessions have a tty (`/dev/ttysNN`), Web Browser sessions
-- return `missing value`. That heuristic targets only the panes this skill
-- can create.
--
-- Defense-in-depth: bail out if iTerm2 isn't running.
tell application "System Events"
    if not ((name of processes) contains "iTerm2") then
        error "iTerm2.app is not running — nothing to close"
    end if
end tell

-- Target vanilla iTerm.app via its bundle id (NOT the bare name "iTerm")
-- so the call cannot be hijacked by a fork like iTermAI.app
-- (com.googlecode.iterm2.iTermAI), which intercepts plain
-- `tell application "iTerm"` calls when both are installed. Mirrors
-- open_preview.applescript and screenshot_preview_pane.applescript.
tell application id "com.googlecode.iterm2"
    tell current window
        tell current tab
            set allSessions to sessions
            repeat with aSession in allSessions
                tell aSession
                    -- Wrap in try because some session classes may not
                    -- expose `tty` at all; we'd rather skip than crash.
                    try
                        set sessionTty to tty
                        -- `missing value` = no shell attached = a Web
                        -- Browser session (or any other non-pty session).
                        -- Shell sessions return their device path and
                        -- stay open.
                        if sessionTty is missing value then
                            close
                        end if
                    end try
                end tell
            end repeat
        end tell
    end tell
end tell
