# Portfolio Gallery Setup Guide

## Video File Requirements

Place your 6 kitchen walkthrough videos in this directory structure:

```
/videos/
  ├── kitchen-1.mp4  (Terracotta Minimalism - Marrakech)
  ├── kitchen-2.mp4  (Alpine Monochrome - Casablanca)
  ├── kitchen-3.mp4  (Forest Sanctuary - Fez)
  ├── kitchen-4.mp4  (Coastal Serenity - Essaouira)
  ├── kitchen-5.mp4  (Luxury Restraint - Rabat)
  └── kitchen-6.mp4  (Warm Geometries - Tangier)
```

### Video Specifications

**Optimal Format:**
- **Codec:** H.264 (libx264)
- **Resolution:** 1920x1080 (16:9 aspect ratio)
- **Frame Rate:** 24-30 fps
- **Bitrate:** 5000-8000 kbps (for crisp, fast-loading videos)
- **Duration:** 6-10 seconds per video
- **File Size:** 5-15 MB per video (compressed for web)

**Audio:**
- Muted on playback (autoplay requires mute)
- Optional: subtle ambient sound/music track

### How to Compress Videos

**Using FFmpeg:**

```bash
ffmpeg -i input.mp4 -c:v libx264 -preset fast -crf 18 -s 1920x1080 -r 30 -c:a aac -b:a 128k output.mp4
```

**Using HandBrake (GUI):**
1. Source: Your video file
2. Destination format: MP4
3. Video Codec: H.264
4. Quality: RF 18-22
5. Framerate: 30 fps
6. Resolution: 1920x1080

### Video Content Tips

Each video should:
- **Open strong:** 0-1 second reveal of the finished kitchen
- **Cinematic flow:** Slow, deliberate pans and walks
- **Lighting focus:** Highlight material textures, surfaces, details
- **Duration:** 8-12 seconds (enough to feel premium, not boring)
- **Aspect ratio:** Full 16:9 (no letterboxing)
- **Color grading:** Warm, inviting, luxury aesthetic

## Architecture

### Component Structure

```
index.html
├── <style> ... portfolio CSS
├── <section id="portfolio"> ... portfolio gallery
├── <section class="portfolio-closer"> ... CTA
└── <script> ... PortfolioGallery class
```

### JavaScript API

The `PortfolioGallery` class manages:

- **Scroll detection** → Animates projects into view
- **Video autoplay** → Plays visible videos, pauses hidden ones
- **Progress dots** → Clickable navigation indicators
- **CTA routing** → Smooth scroll to contact section

### Customization Points

**Project metadata (in JavaScript):**
```javascript
{
  title: "Kitchen Name",
  location: "City",
  materials: "Material list",
  philosophy: "Design approach",
  optimization: "Space solution",
  details: "Special features"
}
```

**Styling variables (in CSS):**
```css
--port-transition: 800ms cubic-bezier(...)  /* Animation speed */
--port-ease: cubic-bezier(...)               /* Easing function */
```

## Performance Notes

- Videos load on-demand as you scroll
- Only visible videos play (lazy loading)
- Progress dots show which project is active
- Mobile optimized: vertical progress dots become horizontal on small screens
- Respects `prefers-reduced-motion` for accessibility

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Semantic HTML structure
- Keyboard navigation via progress dots
- Respects reduced motion preferences
- Video controls available on click
- High contrast overlay text

## Deployment Checklist

- [ ] Place 6 MP4 videos in `/videos/` folder
- [ ] Test video loading on target connection speed
- [ ] Verify responsive behavior on mobile
- [ ] Check video autoplay works in target browsers
- [ ] Test progress dot navigation
- [ ] Verify CTA buttons navigate correctly
- [ ] Check lighthouse performance score
- [ ] Test on iOS Safari (different autoplay rules)
