# Hero-сцена — пошаговый гайд (Nano Banana Pro → Kling → мне)

**Сколько картинок:** 2 (первый кадр + последний кадр) = 1 клип Kling. Этого хватит для теста Hero.

---

## Шаг 1 — Nano Banana Pro: кадр A (первый)
1. Открой Nano Banana Pro.
2. Формат **16:9**, максимальное качество.
3. Вставь промт **PROMPT A** (ниже). Сгенерируй.
4. Выбери лучший вариант → скачай как `frame-a.png`.

## Шаг 2 — Nano Banana Pro: кадр B (последний)
1. **Важно:** чтобы сцена совпала — загрузи `frame-a.png` как **референс** (image-to-image / "edit / use as reference").
2. Вставь промт **PROMPT B**. Сгенерируй.
3. Скачай как `frame-b.png`.
   (B = та же сцена, свет, палитра — изменилось только положение камеры. Это критично для плавной интерполяции.)

## Шаг 3 — Kling: видео из 2 кадров
1. Открой Kling → **Image to Video** → режим **Start frame + End frame** (первый/последний кадр).
2. Start frame = `frame-a.png`, End frame = `frame-b.png`.
3. Motion-промт = **KLING PROMPT** (ниже).
4. Длительность **5 сек**, формат **16:9**, качество максимум.
5. Сгенерируй → скачай `hero.mp4`.

## Шаг 4 — мне
Кинь `hero.mp4` (или папку кадров) в проект / сюда. Дальше я сам:
`ffmpeg` → ~120 WebP-кадров → компонент `SequenceScrub` → прикручу к Hero → проверю.

---

## ГОТОВЫЕ ПРОМПТЫ (English, подробные)

### PROMPT A — Nano Banana Pro (первый кадр, камера у входа)
```
Ultra-detailed cinematic film still, 16:9 aspect ratio, photorealistic 3D-render look.
A dark cinematic tunnel made of dozens of floating, softly glowing movie-poster frames
arranged in a gentle spiral that recedes deep into the distance. Each poster is a rectangular
film still in a thin matte-black border, faintly backlit. Near-black background (#0B0B0B),
heavy volumetric haze, deep cinematic shadows. A subtle crimson-red glow (#E50914) emanates
from within the corridor, rim-lighting the edges of the frames. Camera placed at the very
ENTRANCE of the corridor, wide-angle lens, looking straight down the spiral into the depth.
Anamorphic lens flares, shallow depth of field, the far frames softly blurred. Premium,
luxurious, moody Netflix-trailer atmosphere, fine film grain, high dynamic range, rich contrast.
Negative: no text, no captions, no logos, no watermark, no people, no ui.
```

### PROMPT B — Nano Banana Pro (последний кадр, камера глубоко внутри)
> Сначала загрузи frame-a.png как референс, потом этот промт:
```
Keep the EXACT same scene, environment, lighting, color palette and style as the reference
image (the glowing movie-poster corridor). Do not change the art direction. Now move the CAMERA
FORWARD, deep inside the corridor: the glowing movie-poster frames now surround the viewer on
all sides, much closer and larger, with subtle motion streaks. One large glowing poster fills
the right foreground. The crimson-red glow (#E50914) is stronger and warmer, the haze denser.
Same near-black #0B0B0B background, same anamorphic lens flares, same film grain, same
photorealistic cinematic render. Camera looking forward into the remaining depth of the spiral.
16:9 aspect ratio. Negative: no text, no captions, no logos, no watermark, no people, no ui.
```

### KLING PROMPT — motion (между A и B)
```
Smooth continuous forward dolly: a slow cinematic push-in flying through the glowing
movie-poster corridor, gentle spiral motion following the frames, subtle parallax between
near and far posters, drifting volumetric fog, the red glow softly breathing. Steady elegant
camera, no cuts, no warping, no morphing artifacts, consistent lighting and color throughout.
```

---

## Советы для лучшего результата
- A и B — **одна сцена/свет/палитра**, меняется только камера. Используй A как референс для B.
- Если Kling «плывёт» (морфит) — кадры слишком разные; сделай B ближе к A (камера сдвинулась меньше).
- Генерируй A в нескольких вариантах, выбери самый «глубокий» коридор — он задаёт всю сцену.
- Один стиль на весь сайт: для других секций повторяй базовый стиль (тёмное, #0B0B0B, красный #E50914, film grain, anamorphic), меняй только содержание сцены.
- Разрешение кадров одинаковое (16:9). Чем выше — тем лучше скраб (но тяжелее; 1920×1080 ок).
