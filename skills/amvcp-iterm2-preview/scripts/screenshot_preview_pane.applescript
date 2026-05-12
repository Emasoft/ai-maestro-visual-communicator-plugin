-- Screenshot the right half of the front iTerm2 window — that pane is
-- always the preview pane in our open_preview.applescript layout (which
-- does `split vertically`, putting the new Web Browser pane on the right).
--
-- Usage:
--     osascript screenshot_preview_pane.applescript /tmp/preview.png
--
-- Why right-half-of-window instead of per-session frame: iTerm2's
-- AppleScript surface doesn't expose individual session bounds (only
-- window-level `bounds`), and the Python API's Session has no
-- async_get_frame either — only Window does. The right-half assumption
-- matches `split vertically` deterministically, so this is the simplest
-- reliable approach.
on run argv
    if (count of argv) is 0 then
        error "screenshot_preview_pane.applescript: missing argument (output PNG path)"
    end if
    set outFile to item 1 of argv

    tell application id "com.googlecode.iterm2"
        set b to bounds of front window
    end tell
    -- bounds = {x1, y1, x2, y2} — origin top-left of main display, points
    set x1 to (item 1 of b) as integer
    set y1 to (item 2 of b) as integer
    set x2 to (item 3 of b) as integer
    set y2 to (item 4 of b) as integer
    set midX to ((x1 + x2) / 2) as integer
    set w to x2 - midX
    set h to y2 - y1
    set region to (midX as text) & "," & (y1 as text) & "," & (w as text) & "," & (h as text)

    -- screencapture region syntax: "x,y,w,h" — origin top-left, matches AppleScript bounds.
    do shell script "screencapture -x -R " & region & " -t png " & quoted form of outFile
    return outFile
end run
