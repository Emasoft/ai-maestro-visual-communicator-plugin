-- Open a URL in a vertical iTerm2 split pane using the "Web Browser"
-- profile. Argument 1 = complete URL (`file://<abs-path>` for static
-- HTML/SVG, `http://localhost:<port>/...` for the runner's local server).
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

    set pageURL to item 1 of argv

    tell application "iTerm"
        activate
        tell current window
            tell current tab
                tell current session
                    set newPane to split vertically with profile "Web Browser"
                end tell
                tell newPane
                    write text pageURL
                end tell
            end tell
        end tell
    end tell
end run
