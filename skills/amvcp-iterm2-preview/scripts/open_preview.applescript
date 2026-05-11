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
    -- they want the old behaviour back (toggle "Dim inactive split panes"
    -- on AND drag the Amount slider above 0%).
    do shell script "defaults write com.googlecode.iterm2 DimInactiveSplitPanes -bool false"
    do shell script "defaults write com.googlecode.iterm2 SplitPaneDimmingAmount -float 0.0"

    set pageURL to item 1 of argv

    tell application "iTerm"
        activate
        tell current window
            tell current tab
                tell current session
                    set newPane to split vertically with profile "Web Browser"
                end tell
                tell newPane
                    -- Friendly title for the per-pane title bar (when the
                    -- user has Settings → Profiles → "Web Browser" → General
                    -- → "Show Title Bar" enabled). Without that toggle the
                    -- name is invisible.
                    set name to "amvcp Preview"
                    -- Bright-gray tab color (~#D0D0D0) on the preview pane.
                    -- iTerm2's "tab color" tints the per-pane title bar
                    -- background, so the preview pane is visually distinct
                    -- from the terminal pane regardless of focus state — and
                    -- on themes that DO render focus differently (Light /
                    -- Dark / Regular, not Minimal / Compact / Automatic), the
                    -- bright gray will still brighten/darken on focus change
                    -- vs the user's default profile color. Persistent in the
                    -- sense that we re-apply it on every preview open; iTerm2
                    -- session tab colors don't survive a window close.
                    -- AppleScript RGB is 16-bit per channel (0-65535):
                    -- 53456 ≈ 0xD0 ≈ 81 % brightness on each channel.
                    set use tab color to true
                    set tab color to {53456, 53456, 53456}
                    write text pageURL
                end tell
            end tell
        end tell
    end tell
end run
