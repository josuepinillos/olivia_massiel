# CLAUDE CODE — OLIVIA MASSIEL BABY SHOWER LANDING

## ROLE
Act as a senior product designer + art director + UI/UX designer + front-end engineer. Build a premium, editorial, mobile-first invitation landing for the Baby Shower of **Olivia Massiel**.

## NON-NEGOTIABLE CREATIVE DIRECTION
The approved visual is the source of truth. The page must feel like **a real nursery photograph transformed into a subtle interactive digital scene**, not like a generic baby-shower template.

### Preserve the approved visual
- Use `assets/production/hero.webp` as the main key visual.
- Do NOT regenerate, repaint, recolor, retouch, crop destructively, or replace the hero.
- Do NOT alter the crib, nursery, mobile, toys, woven name banner, lighting, texture, proportions, or palette.
- `hero-mobile.webp` is only a controlled crop option if the mobile composition genuinely needs it; prefer the original hero whenever it fits naturally.
- The reference images in `assets/reference/` are visual references only and must NOT become production content.

## VISUAL SYSTEM
Palette: warm ivory / cream / beige / dusty blush / taupe / soft brown.
Typography: refined editorial serif for the main name and elegant neutral sans-serif for metadata.
Use generous whitespace, delicate separators, tiny heart/star motifs, soft shadows, and restrained motion.
No saturated pink, blue, purple, cartoon UI, gradients that fight the photograph, confetti, balloons, or generic baby icons.

## EVENT CONTENT
Use a single data object/config so the content is easy to edit:
- Baby Shower
- Olivia Massiel
- 12 de octubre de 2026
- 4:00 p.m.
- Salón Los Olivos
- Av. Los Olivos 123, Chiclayo
- CTA: Ver ubicación / Ver ruta
- RSVP CTA: Confirmar asistencia
- Closing: Con amor, Olivia Massiel

## INFORMATION ARCHITECTURE
1. HERO — full-bleed / near full viewport photograph.
   - small eyebrow: BABY SHOWER
   - OLIVIA / MASSIEL
   - short emotional line: “Estamos esperando con mucho amor tu llegada.”
   - discreet “DESCUBRE MÁS ↓”
2. INVITACIÓN — date, time, venue, route CTA.
3. LA ESPERA — “MÁS BONITA” + short emotional copy.
4. COUNTDOWN — days / hours / minutes / seconds.
5. UBICACIÓN — venue, address, map placeholder/link.
6. RSVP — “¿NOS ACOMPAÑAS?” + confirmation CTA.
7. CLOSING — elegant final sign-off.

## HERO INTERACTION — IMPORTANT
The interaction is an enhancement layer, NOT a redesign.

### Objects
Use the transparent production assets for the mobile objects:
- lion.webp
- elephant.webp
- zebra.webp
- giraffe.webp
- mobile-ring.webp

If the hero already visually contains these elements, do not duplicate them on top. Only use transparent assets as interactive layers when they align exactly with the source visual and improve separation/performance. If there is any risk of visible mismatch, keep the hero as a single image and use invisible interaction hotspots instead.

### Cursor / pointer behavior
Desktop:
- subtle cursor parallax, max ~6–10 px total movement.
- each interactive toy has independent, slow idle sway.
- pointer entering a toy triggers a tiny physical impulse and a single musical tone.
- no constant sound while pointer remains over the element.
- no aggressive scaling; max ~1.02–1.04.
- use spring/easing that feels like a suspended object, not a UI button.

### Mobile behavior
No hover dependency.
- tap on an interactive object triggers the same tiny impulse + sound.
- use touch movement / scroll for very subtle parallax.
- DeviceOrientation may be supported as an optional enhancement, but never block the experience behind a permission request.
- if orientation is unavailable or permission is denied, fall back silently to touch/scroll.

## SOUND — TAKE ONLY THIS FUNCTIONAL IDEA
This is the only behavior concept borrowed from the previous Gemini implementation: **Web Audio API-generated soft musical tone on interaction**.

Do NOT copy Gemini's visual design, components, layout, text, SVG art, controls, or architecture.

Use the isolated module `docs/audio-hover.js` as a reference/starting point.

Sound requirements:
- Web Audio API; no external audio file required.
- very soft, warm, bell/music-box character.
- short decay (~0.4–0.5 s).
- low volume; never startling.
- one note per interaction.
- different notes for different objects/letters, preferably from a pleasant pentatonic/diatonic set.
- cooldown/debouncing so rapid pointer movement does not spam audio.
- do not create a new AudioContext per hover.
- lazily create/resume AudioContext only after a user gesture/allowed interaction.
- handle browsers that block autoplay gracefully.
- no sound on initial page load.
- provide a small, discreet mute/sound control only if necessary for UX; if included, make it visually subordinate and consistent with the design.

### Name interaction
The text OLIVIA MASSIEL may have very subtle per-letter hover/tap hotspots and tones, but DO NOT replace the approved woven/bunting name treatment with new graphics.
If the woven name is baked into the hero image, use invisible hotspots or a transparent overlay only. The visual must remain unchanged.

## MOTION SYSTEM
Use transform/opacity where possible.
Prefer Framer Motion/Motion if the existing project already uses it; otherwise avoid adding dependencies unless necessary.
Implement:
- section entrance reveal
- gentle floating/swaying objects
- pointer parallax
- hover/tap impulse
- smooth scroll
- countdown updates
Respect `prefers-reduced-motion: reduce` by disabling non-essential motion and sound.

## RESPONSIVE DESIGN
Design mobile first for 360, 375, 390, 414, 430 px widths.
Then adapt elegantly to tablet and desktop.
Do not simply scale the desktop composition down.
Avoid horizontal overflow at every breakpoint.
Maintain the visual hierarchy of the approved mobile mockup.

## PERFORMANCE
- WebP assets.
- responsive image loading where useful.
- lazy-load below-the-fold images.
- avoid large JS animation loops when CSS transforms are enough.
- no unnecessary dependencies.
- avoid layout thrashing.
- use requestAnimationFrame only for pointer/parallax systems that need it.
- ensure no cumulative layout shift from images.

## ACCESSIBILITY
- semantic HTML.
- keyboard-accessible CTAs.
- visible focus states that still match the visual system.
- alt text for meaningful images.
- `prefers-reduced-motion` support.
- sound is never required to understand content.
- sufficient text contrast without damaging the palette.

## IMPLEMENTATION RULES
1. First inspect the existing repository before changing anything.
2. Reuse its framework and architecture.
3. Do not create a new project.
4. Do not delete existing functionality without proving it is obsolete.
5. Do not copy the Gemini page wholesale.
6. Do not import its visual styles.
7. Integrate only the sound interaction concept and the necessary Web Audio logic.
8. Keep event data centralized.
9. Keep interactive hero logic modular and testable.
10. Use the production assets in `assets/production/`.

## ACCEPTANCE TEST
Before declaring completion:
- run the project's build/lint/typecheck commands.
- test 360 / 390 / 430 px.
- test desktop pointer hover.
- test touch/tap behavior.
- verify sound is not triggered on page load.
- verify sound is not continuously looping on hover.
- verify cooldown works.
- verify muted/reduced-motion behavior.
- verify no horizontal overflow.
- verify hero composition has not been visually altered.
- verify countdown uses the configured event date.
- verify every CTA works or has a clearly documented placeholder.

## FINAL REPORT TO USER
When finished, report:
- files created/modified;
- dependencies added (if any);
- how the sound system works;
- how to edit event data;
- how to replace hero/assets;
- commands used to validate the build.

**Most important rule:** if a technical improvement conflicts with the approved visual composition, preserve the approved visual composition.
