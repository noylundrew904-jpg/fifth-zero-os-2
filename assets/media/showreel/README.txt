The homepage hero can run one dedicated showreel instead of the
studio placeholder. Drop files in here using these exact names:

  assets/media/showreel/showreel.mp4          desktop/default
  assets/media/showreel/showreel.webm         optional, smaller file size
  assets/media/showreel/showreel-mobile.mp4   optional, lighter cut for phones (<640px)
  assets/media/showreel/poster.jpg            shown before/while the video loads

Then point REPLAY_SHOWREEL at them in assets/js/data.js — that's the
only edit needed, the homepage picks it up automatically.

What the showreel should be, and isn't:
  - It is the single most important clip on the site — muted autoplay,
    looping, so the first 5-10 seconds carry the whole first
    impression. Cut it accordingly: strongest material first, no
    slow build-up.
  - It is NOT a project case study — it's a compilation/sizzle reel
    representing the studio as a whole, separate from the individual
    films in assets/media/projects/.

Until real files are added here, the hero keeps showing the studio's
animated placeholder treatment — never a blank or broken player.
