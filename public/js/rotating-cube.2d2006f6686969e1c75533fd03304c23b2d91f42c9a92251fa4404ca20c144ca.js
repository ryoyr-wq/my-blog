// assets/js/rotating-cube.js
(function() {
  function initCube(containerId, scale = 1.0) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let width, height;
    function resize() {
      width = container.clientWidth;
      height = width * 0.75; // 4:3 aspect ratio
      canvas.width = width;
      canvas.height = height;
    }
    window.addEventListener('resize', resize);
    resize();

    const FPS = 30;
    const DIST = 3.5;
    const SCALE = 1.2 * scale;

    const verts = [
      [-1, -1, -1], [ 1, -1, -1],
      [ 1,  1, -1], [-1,  1, -1],
      [-1, -1,  1], [ 1, -1,  1],
      [ 1,  1,  1], [-1,  1,  1],
    ];

    const edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],
    ];

    function rotX(p, a) {
      let [x, y, z] = p;
      let ca = Math.cos(a), sa = Math.sin(a);
      return [x, ca*y - sa*z, sa*y + ca*z];
    }
    function rotY(p, a) {
      let [x, y, z] = p;
      let ca = Math.cos(a), sa = Math.sin(a);
      return [ca*x + sa*z, y, -sa*x + ca*z];
    }
    function rotZ(p, a) {
      let [x, y, z] = p;
      let ca = Math.cos(a), sa = Math.sin(a);
      return [ca*x - sa*y, sa*x + ca*y, z];
    }

    function project(p) {
      let [x, y, z] = p;
      let zCam = z + DIST;
      if (zCam <= 0.1) zCam = 0.1;
      let f = 1.0 / zCam;
      let px = width * 0.5 + (x * f) * (width * 0.5) * SCALE;
      let py = height * 0.5 - (y * f) * (height * 0.5) * SCALE;
      return [px, py];
    }

    let t = 0;
    function animate() {
      ctx.clearRect(0, 0, width, height);
      
      // Theme-aware colors (Blowfish uses CSS variables)
      const color = getComputedStyle(document.documentElement).getPropertyValue('--tw-prose-body') || '#ffffff';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      let ax = t * 0.9;
      let ay = t * 1.3;
      let az = t * 0.7;

      let proj = verts.map(v => {
        let p = rotX(v, ax);
        p = rotY(p, ay);
        p = rotZ(p, az);
        return project(p);
      });

      edges.forEach(([i, j]) => {
        let [x0, y0] = proj[i];
        let [x1, y1] = proj[j];
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      });

      t += 1.0 / FPS;
      requestAnimationFrame(animate);
    }

    animate();
  }

  window.initCube = initCube;
})();
