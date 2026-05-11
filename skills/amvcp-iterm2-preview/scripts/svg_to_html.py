#!/usr/bin/env python3
"""Wrap an SVG file in a minimal HTML page so it renders cleanly inside
the iTerm2 Web Browser pane: dark background, centered, no scrollbars.
Usage: python3 svg_to_html.py <input.svg> <output.html>
"""

from __future__ import annotations

import sys
from pathlib import Path


def wrap_svg(svg_path: str, html_path: str) -> None:
    svg_content = Path(svg_path).read_text(encoding="utf-8")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Diagram Preview</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html, body {{
      width: 100%; height: 100%;
      background: #1e1e2e;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
    }}
    .container {{ padding: 24px; max-width: 100%; }}
    svg {{ max-width: 100%; height: auto; display: block; }}
  </style>
</head>
<body>
  <div class="container">
    {svg_content}
  </div>
</body>
</html>
"""
    Path(html_path).write_text(html, encoding="utf-8")
    print(f"Written: {html_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 svg_to_html.py <input.svg> <output.html>")
        sys.exit(1)
    wrap_svg(sys.argv[1], sys.argv[2])
