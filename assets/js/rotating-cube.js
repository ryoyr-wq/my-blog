// A quiet, uncoloured 3 × 3 wireframe cube for ryoyr.log.
(function () {
  const CUBE_STATE_KEY = 'ryoyrCubeState'
  const CUBE_STATE_VERSION = 1

  function loadCubeState() {
    try {
      const state = JSON.parse(window.sessionStorage.getItem(CUBE_STATE_KEY))
      if (!state || state.version !== CUBE_STATE_VERSION || !Array.isArray(state.cubelets) || state.cubelets.length !== 26) return null
      const positions = new Set()
      const valid = state.cubelets.every((position) => {
        if (!Array.isArray(position) || position.length !== 3 || !position.every((value) => Number.isInteger(value) && value >= -1 && value <= 1)) return false
        const key = position.join(',')
        if (key === '0,0,0' || positions.has(key)) return false
        positions.add(key)
        return true
      })
      if (!valid || !Number.isFinite(state.rotationTime) || !Number.isFinite(state.waveTime) || !Number.isFinite(state.speedPhase) || !Number.isFinite(state.savedAt)) return null
      return state
    } catch (_) {
      return null
    }
  }

  function initCube(containerId, scale = 1, type = 'rubiks', mode = 'hero') {
    const container = document.getElementById(containerId)
    if (!container) return

    const canvas = document.createElement('canvas')
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    container.appendChild(canvas)
    const ctx = canvas.getContext('2d')
    let width = 0
    let height = 0

    function resize() {
      const dpr = window.devicePixelRatio || 1
      width = container.clientWidth
      height = width * 0.75
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function rotateX([x, y, z], angle) {
      const c = Math.cos(angle), s = Math.sin(angle)
      return [x, c * y - s * z, s * y + c * z]
    }

    function rotateY([x, y, z], angle) {
      const c = Math.cos(angle), s = Math.sin(angle)
      return [c * x + s * z, y, -s * x + c * z]
    }

    function rotateZ([x, y, z], angle) {
      const c = Math.cos(angle), s = Math.sin(angle)
      return [c * x - s * y, s * x + c * y, z]
    }

    function transform(point, rotation) {
      return rotateZ(rotateY(rotateX(point, rotation.x), rotation.y), rotation.z)
    }

    function smoothstep(min, max, value) {
      const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
      return t * t * (3 - 2 * t)
    }

    function project([x, y]) {
      // The assembled object is wider than the former single-cube outline.
      const base = (width / 10.4) * scale
      return [width * 0.5 + x * base, height * 0.5 - y * base]
    }

    // 26 independent cubelets: the centre at (0, 0, 0) is intentionally absent.
    // A small gap between 0.41-unit cubelets keeps the assembly legible as a Rubik's Cube.
    const cubeletHalf = 0.41
    const cubeExtent = 1 + cubeletHalf
    const cubeletVertices = [
      [-cubeletHalf, -cubeletHalf, -cubeletHalf], [cubeletHalf, -cubeletHalf, -cubeletHalf],
      [cubeletHalf, cubeletHalf, -cubeletHalf], [-cubeletHalf, cubeletHalf, -cubeletHalf],
      [-cubeletHalf, -cubeletHalf, cubeletHalf], [cubeletHalf, -cubeletHalf, cubeletHalf],
      [cubeletHalf, cubeletHalf, cubeletHalf], [-cubeletHalf, cubeletHalf, cubeletHalf],
    ]
    const edgeIndices = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ]

    function createCubelets() {
      const cubelets = []
      for (let x = -1; x <= 1; x += 1) {
        for (let y = -1; y <= 1; y += 1) {
          for (let z = -1; z <= 1; z += 1) {
            if (x === 0 && y === 0 && z === 0) continue
            const position = [x, y, z]
            cubelets.push({ position, waveAnchor: [...position] })
          }
        }
      }
      return cubelets
    }

    function rotateOnAxis(point, axis, angle) {
      if (axis === 'x') return rotateX(point, angle)
      if (axis === 'y') return rotateY(point, angle)
      return rotateZ(point, angle)
    }

    function turnPosition(position, axis, direction) {
      return rotateOnAxis(position, axis, direction * Math.PI / 2).map((value) => Math.round(value))
    }

    function outerEdgeFactor(a, b) {
      return Math.max(...[0, 1, 2].map((axis) => {
        const aProximity = Math.max(0, 1 - Math.abs(Math.abs(a[axis]) - cubeExtent) / cubeletHalf)
        const bProximity = Math.max(0, 1 - Math.abs(Math.abs(b[axis]) - cubeExtent) / cubeletHalf)
        return aProximity * bProximity
      }))
    }

    const cubelets = createCubelets()
    const savedState = loadCubeState()
    if (savedState) {
      cubelets.forEach((cubelet, index) => {
        cubelet.position = [...savedState.cubelets[index]]
      })
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // The floating mark is deliberately quieter at its smaller display size.
    const waveAmplitude = scale < 0.5 ? 0.09 : 0.15
    const MIN_ROTATION_SPEED = 0.01
    const MAX_ROTATION_SPEED = 0.05
    const ROTATION_SPEED_CYCLE = 12000
    const faceTurnsEnabled = (mode === 'hero' || mode === 'article') && scale >= 0.5 && !reduceMotion
    const faces = [
      { axis: 'x', layer: 1, key: 'R' }, { axis: 'x', layer: -1, key: 'L' },
      { axis: 'y', layer: 1, key: 'U' }, { axis: 'y', layer: -1, key: 'D' },
      { axis: 'z', layer: 1, key: 'F' }, { axis: 'z', layer: -1, key: 'B' },
    ]
    let activeTurn = null
    let lastFace = null
    let sequence = null
    let nextTurnAt = faceTurnsEnabled ? performance.now() + 2500 + Math.random() * 1500 : Infinity
    const initializedAt = performance.now()
    const elapsedSinceSave = savedState ? Math.max(0, Math.min(300000, Date.now() - savedState.savedAt)) : 0
    const speedPhase = savedState ? (savedState.speedPhase + elapsedSinceSave) % ROTATION_SPEED_CYCLE : 0
    const rotationCycleStartedAt = initializedAt - speedPhase
    let rotationTime = savedState ? savedState.rotationTime : 0
    let time = savedState ? savedState.waveTime : 0

    function rotationSpeed(now) {
      const phase = ((now - rotationCycleStartedAt) / ROTATION_SPEED_CYCLE) * Math.PI * 2
      const normalized = 0.5 - 0.5 * Math.cos(phase)
      return MIN_ROTATION_SPEED + (MAX_ROTATION_SPEED - MIN_ROTATION_SPEED) * normalized
    }

    if (savedState) {
      const elapsedFrames = elapsedSinceSave / (1000 / 60)
      rotationTime += rotationSpeed(initializedAt) * elapsedFrames
      time += 0.03 * elapsedFrames
    }

    function persistState() {
      try {
        window.sessionStorage.setItem(CUBE_STATE_KEY, JSON.stringify({
          version: CUBE_STATE_VERSION,
          cubelets: cubelets.map((cubelet) => cubelet.position),
          rotationTime,
          waveTime: time,
          speedPhase: (performance.now() - rotationCycleStartedAt) % ROTATION_SPEED_CYCLE,
          savedAt: Date.now(),
        }))
      } catch (_) {
        // Storage can be unavailable in privacy-restricted browser contexts.
      }
    }

    function sequenceLength() {
      const roll = Math.random()
      if (roll < 0.5) return 2
      if (roll < 0.85) return 3
      return 4
    }

    function startNextTurn(now) {
      const choices = faces.filter((face) => face.key !== sequence.lastFace && face.key !== lastFace)
      const face = choices[Math.floor(Math.random() * choices.length)]
      activeTurn = {
        ...face,
        direction: Math.random() < 0.5 ? -1 : 1,
        startedAt: now,
        duration: 850,
      }
      sequence.state = 'turning'
    }

    function startSequence(now) {
      sequence = { remaining: sequenceLength(), lastFace: null, state: 'ready', nextAt: now }
      startNextTurn(now)
    }

    function updateTurn(now) {
      if (!faceTurnsEnabled) return
      if (!sequence && now >= nextTurnAt) startSequence(now)
      if (sequence && sequence.state === 'sequence-pause' && now >= sequence.nextAt) startNextTurn(now)
      if (!activeTurn) return

      const progress = Math.min(1, (now - activeTurn.startedAt) / activeTurn.duration)
      if (progress < 1) return

      cubelets.forEach((cubelet) => {
        const axisIndex = activeTurn.axis === 'x' ? 0 : activeTurn.axis === 'y' ? 1 : 2
        if (cubelet.position[axisIndex] === activeTurn.layer) {
          cubelet.position = turnPosition(cubelet.position, activeTurn.axis, activeTurn.direction)
        }
      })
      persistState()
      lastFace = activeTurn.key
      activeTurn = null
      sequence.remaining -= 1
      sequence.lastFace = lastFace
      if (sequence.remaining > 0) {
        sequence.state = 'sequence-pause'
        sequence.nextAt = now + 150 + Math.random() * 150
        return
      }

      sequence = null
      nextTurnAt = now + (mode === 'article' ? 2500 + Math.random() * 1500 : 4000 + Math.random() * 3000)
    }

    function turnAngle(cubelet, now) {
      if (!activeTurn) return 0
      const axisIndex = activeTurn.axis === 'x' ? 0 : activeTurn.axis === 'y' ? 1 : 2
      if (cubelet.position[axisIndex] !== activeTurn.layer) return 0
      const progress = Math.min(1, (now - activeTurn.startedAt) / activeTurn.duration)
      const eased = progress * progress * (3 - 2 * progress)
      return activeTurn.direction * Math.PI / 2 * eased
    }

    function draw(now) {
      ctx.clearRect(0, 0, width, height)
      const css = getComputedStyle(document.documentElement)
      const color = css.getPropertyValue('--lab-ink').trim() || '#17171b'
      const rotation = {
        // Start with front, top and side clearly visible; then move almost imperceptibly.
        x: 0.58 + rotationTime * 0.19,
        y: -0.7 + rotationTime * 0.27,
        z: 0.08 + rotationTime * 0.08,
      }

      const paintedLines = []
      cubelets.forEach((cubelet) => {
        const angle = turnAngle(cubelet, now)
        const vertices = cubeletVertices.map(([x, y, z]) => {
          const point = [cubelet.position[0] + x, cubelet.position[1] + y, cubelet.position[2] + z]
          return rotateOnAxis(point, activeTurn ? activeTurn.axis : 'x', angle)
        })
        edgeIndices.forEach(([from, to]) => {
          const a = vertices[from]
          const b = vertices[to]
          const cameraA = transform(a, rotation)
          const cameraB = transform(b, rotation)
          paintedLines.push({
            a: cameraA,
            b: cameraB,
            depth: (cameraA[2] + cameraB[2]) / 2,
            waveAnchor: cubelet.waveAnchor,
            outerFactor: outerEdgeFactor(a, b),
          })
        })
      })
      paintedLines.sort((left, right) => ((left.a[2] + left.b[2]) - (right.a[2] + right.b[2])))

      ctx.strokeStyle = color
      paintedLines.forEach((line) => {
        // Each edge uses its current camera depth, including the temporary face-turn transform.
        const depthFactor = 0.2 + 0.8 * smoothstep(-1.7, 1.7, line.depth)
        // A cubelet carries its Wave phase through a face turn rather than abruptly changing shade.
        const wavePosition = line.waveAnchor[0] * 0.9 + line.waveAnchor[1] * 0.65 + line.waveAnchor[2] * 0.8
        const wave = 0.5 + 0.5 * Math.sin(wavePosition * 1.35 - time * 2.6)
        const waveFactor = 1 + (wave - 0.5) * 2 * waveAmplitude
        const baseOpacity = 0.39 + 0.25 * line.outerFactor
        ctx.lineWidth = line.outerFactor > 0.99 ? 0.58 : 0.38
        ctx.globalAlpha = Math.max(0.025, Math.min(0.75, baseOpacity * depthFactor * waveFactor))
        const a = project(line.a)
        const b = project(line.b)
        ctx.beginPath()
        ctx.moveTo(a[0], a[1])
        ctx.lineTo(b[0], b[1])
        ctx.stroke()
      })
      ctx.globalAlpha = 1
    }

    function animate(now = performance.now()) {
      updateTurn(now)
      draw(now)
      rotationTime += rotationSpeed(now)
      time += 0.03
      if (!reduceMotion) requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener('resize', () => {
      resize()
      draw(performance.now())
    }, { passive: true })
    window.addEventListener('pagehide', persistState, { passive: true })
    // `type` remains accepted so existing shortcode calls stay API-compatible.
    void type
    animate()
  }

  window.initCube = initCube
})()
