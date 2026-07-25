# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static marketing site for Yantrax, an autonomous museum-guide robot built for the World Robot Olympiad. Three hand-written files — `index.html`, `style.css`, `script.js` — with no build system, package manager, framework, or tests.

## Development

There are no build/lint/test commands. To preview, open `index.html` directly or serve the directory:

```bash
python3 -m http.server 8000
```

## Architecture

`index.html` is one long single-page layout (header → hero → marquee → robot → pipeline → mission → technology → milestones → team → contact → footer), styled entirely by `style.css` and animated by `script.js`. GSAP + ScrollTrigger load from cdnjs; everything else is dependency-free vanilla JS.

`script.js` is a series of independent IIFEs, one per feature. Key patterns shared across them:

- **Canvas particle scenes** (`#dome` hero sphere, `#evolution` morphing sculpture, `#navmap` milestones map, `#wordmark` footer text) all use the shared helpers at the top of the file: `setupCanvas` (DPR-aware sizing), `trackMouse` (mouse repulsion input), and `onVisible` (IntersectionObserver pauses rAF loops off-screen). Text/shape-based scenes rasterize to an offscreen canvas and sample alpha pixels into particle targets.
- **Reduced motion**: every animation checks the module-level `reduceMotion` flag and degrades to a static render. Preserve this when adding animation.
- **Scroll reveals have two layers**: elements carry the `.reveal` CSS class as a fallback, but when GSAP loads, the GSAP IIFE strips `.reveal` and takes ownership via ScrollTrigger (the `revealSets` selector list). New revealed elements need both the class and an entry in `revealSets`.
- The contact form is demo-only (`preventDefault`, no backend).

`style.css` defines the design tokens in `:root` (grayscale palette, `--font-main` = self-hosted Overused Grotesk in `fonts/`, `--font-pixel` = Jersey 20/DotGothic16 from Google Fonts). Accent red `#c73f2e` is hardcoded where used (e.g. the navmap robot dot).
