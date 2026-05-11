-- Close every non-active session in the current iTerm2 tab. Used to
-- collapse the preview pane back to a single terminal session.
--
-- Same defense-in-depth check as open_preview.applescript: bail out if
-- iTerm2 isn't running so a misfired osascript call doesn't error
-- cryptically.
tell application "System Events"
    if not ((name of processes) contains "iTerm2") then
        error "iTerm2.app is not running — nothing to close"
    end if
end tell

tell application "iTerm"
    tell current window
        tell current tab
            set allSessions to sessions
            repeat with aSession in allSessions
                if aSession is not current session then
                    tell aSession to close
                end if
            end repeat
        end tell
    end tell
end tell
