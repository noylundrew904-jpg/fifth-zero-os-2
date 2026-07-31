FONTS FOLDER
============

This build ships working immediately using Google Fonts over CDN (see the
@import at the top of style.css) — you don't need to do anything to get
IBM Plex Mono + Newsreader rendering correctly.

If you'd rather fully self-host the fonts (no external requests, works
offline, slightly faster first paint), download the .woff2 files yourself
and drop them in this folder, then swap the @font-face block already
commented out at the top of style.css to point at them instead of the
Google Fonts @import:

  1. IBM Plex Mono (weights 400/500/600):
     https://fonts.google.com/specimen/IBM+Plex+Mono
  2. Newsreader (italic, weights 400/500):
     https://fonts.google.com/specimen/Newsreader

Expected filenames if you use the commented @font-face block as-is:
  fonts/IBMPlexMono-Regular.woff2
  fonts/IBMPlexMono-Medium.woff2
  fonts/IBMPlexMono-SemiBold.woff2
  fonts/Newsreader-Italic.woff2

I can't fetch or embed the actual binary font files myself in this
environment (no network access when generating your files) — this note
is here instead of silently shipping something broken.
