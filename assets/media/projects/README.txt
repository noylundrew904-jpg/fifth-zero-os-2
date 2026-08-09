Drop real project media in here, one folder per project, named after
that project's `slug` in assets/js/data.js.

  assets/media/projects/<slug>/hero.mp4          the main film
  assets/media/projects/<slug>/hero.webm         optional, smaller file size
  assets/media/projects/<slug>/hero-mobile.mp4   optional, lighter cut for phones (<640px)
  assets/media/projects/<slug>/poster.jpg        shown before/while the video loads
  assets/media/projects/<slug>/gallery-01.jpg    still frames, numbered in order
  assets/media/projects/<slug>/gallery-02.jpg

Example for the "ignite-summit" project:

  assets/media/projects/ignite-summit/hero.mp4
  assets/media/projects/ignite-summit/poster.jpg
  assets/media/projects/ignite-summit/gallery-01.jpg

Then in assets/js/data.js, point that project's fields at the files:

  media: {
    mp4: 'assets/media/projects/ignite-summit/hero.mp4',
    poster: 'assets/media/projects/ignite-summit/poster.jpg',
    ...
  },
  gallery: [
    { image: 'assets/media/projects/ignite-summit/gallery-01.jpg', alt: '...' },
    ...
  ]

Nothing else needs to change — no build step, no code edits. Any field
left as '' keeps the studio's animated placeholder for that spot instead
of a broken link, so it's safe to publish a project with only some of
its media ready.

Keep source files reasonably compressed before adding them here (this
is a plain static site, so whatever you commit is exactly what ships):
  - hero.mp4: h264, ~1080p, a few Mb/s bitrate is plenty for a looping
    background clip — it does not need to be broadcast-master quality.
  - poster.jpg / gallery images: export at the size they'll actually
    display, not full camera resolution.
