// assets/js/rotating-cube.js
(function() {
  console.log("Rotating Cube with Scroll interaction loaded");

  function initCube(containerId, scale = 1.0) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');

    let width, height;
    function resize() {
      width = container.clientWidth || 400;
      height = width * 0.75;
      canvas.width = width;
      canvas.height = height;
    }
    
    window.addEventListener('resize', resize);
    resize();

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
      
      // テーマの色を取得（取得できない場合はグレー）
      const color = getComputedStyle(document.documentElement).getPropertyValue('--tw-prose-body') || '#888';
      ctx.strokeStyle = color; 
      ctx.lineWidth = 2;

      // --- スクロール連動のコアロジック ---
      // window.scrollY (スクロール量) に 0.005 などの小さな値をかけて回転角にする
      const scrollRotation = window.scrollY * 0.005;

      // 自動回転 (t) + スクロール回転 (scrollRotation)
      let ax = (t * 0.5) + scrollRotation;
      let ay = (t * 0.8) + scrollRotation * 1.5;
      let az = (t * 0.3);

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

      t += 0.02;
      requestAnimationFrame(animate);
    }

    animate();
  }

  window.initCube = initCube;
})();
