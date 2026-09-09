// A display-only Home intro: the real logo period follows three diminishing parabolic bounces.
(() => {
  let running = false
  let runToken = 0

  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))
  const lerp = (start, end, progress) => start + (end - start) * progress
  const transform = (x, y) => `translate3d(${x}px, ${y}px, 0)`

  function animateSegment(dot, from, to, duration, height, token) {
    return new Promise((resolve) => {
      const startedAt = performance.now()
      function frame(now) {
        if (token !== runToken) {
          resolve(false)
          return
        }
        const p = Math.min(1, (now - startedAt) / duration)
        const x = lerp(from.x, to.x, p)
        const baselineY = lerp(from.y, to.y, p)
        // Every bounce is a true parabola; the initial segment is an accelerating fall.
        const y = height ? baselineY - 4 * height * p * (1 - p) : lerp(from.y, to.y, p * p)
        dot.style.transform = transform(x, y)
        if (p < 1) requestAnimationFrame(frame)
        else resolve(true)
      }
      requestAnimationFrame(frame)
    })
  }

  async function play() {
    const dot = document.querySelector('.home-logo-dot')
    if (!dot || running || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const token = ++runToken
    running = true
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready
      await nextFrame()
      await nextFrame()
      if (token !== runToken) return

      const rect = dot.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      // All coordinates are transforms from the dot's real, permanently reserved layout position.
      const start = {
        x: window.innerWidth + rect.width - rect.left,
        y: -Math.min(200, Math.max(140, window.innerHeight * 0.22)),
      }
      const landingOne = { x: start.x * 0.5, y: -28 }
      const landingTwo = { x: start.x * 0.25, y: -12 }
      const landingThree = { x: start.x * 0.08, y: -4 }
      const finalLanding = { x: 0, y: 0 }

      if (!await animateSegment(dot, start, landingOne, 900, 0, token)) return
      if (!await animateSegment(dot, landingOne, landingTwo, 720, 82, token)) return
      if (!await animateSegment(dot, landingTwo, landingThree, 620, 52, token)) return
      if (!await animateSegment(dot, landingThree, finalLanding, 600, 26, token)) return

      // The same element settles at its ordinary layout position; no swap or visual cleanup occurs.
      dot.style.transform = transform(0, 0)
    } catch (_) {
      if (token === runToken) dot.style.transform = ''
    } finally {
      if (token === runToken) running = false
    }
  }

  function cancelActiveRun() {
    runToken += 1
    running = false
    const dot = document.querySelector('.home-logo-dot')
    if (dot) dot.style.transform = ''
  }

  // pageshow covers ordinary navigation as well as bfcache restoration of Home.
  window.addEventListener('pageshow', () => { void play() })
  window.addEventListener('pagehide', cancelActiveRun)
})()
