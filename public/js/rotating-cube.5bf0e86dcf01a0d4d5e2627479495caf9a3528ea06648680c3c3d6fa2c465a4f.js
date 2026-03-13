// assets/js/rotating-cube.js
(function() {
  console.log("Rotating Cube (Orthographic) loaded");

  function initCube(containerId, scale = 1.0) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.display = "block";
    canvas.style.width = "100%"; // CSSでサイズを制御
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');

    let width, height;
    function resize() {
      // 高解像度ディスプレイ（Retinaなど）でも綺麗に見えるように調整
      const dpr = window.devicePixelRatio || 1;
      width = container.clientWidth;
      height = width * 0.75;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr); // 描画コンテキストをスケーリング
      
      console.log("Canvas resized with DPR:", dpr);
    }
    
    window.addEventListener('resize', resize);
    resize();

    // スケールの基準（画面の幅に合わせて調整）
    const BASE_SCALE = 80 * scale;

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

    // --- 平行投影 (Orthographic Projection) ---
    function project(p) {
      let [x, y, z] = p;
      // 距離によるスケーリングを廃止し、定数をかけるだけにする
      // これにより、パースによる歪みが消えます
      let px = width * 0.5 + x * BASE_SCALE;
      let py = height * 0.5 - y * BASE_SCALE;
      return [px, py];
    }

    let t = 0;
    function animate() {
      ctx.clearRect(0, 0, width, height);
      
      const color = getComputedStyle(document.documentElement).getPropertyValue('--tw-prose-body') || '#888';
      ctx.strokeStyle = color; 
      ctx.lineWidth = 2;
      ctx.lineJoin = "round"; // 角を滑らかに

      const scrollRotation = window.scrollY * 0.005;
      let ax = (t * 0.3) + scrollRotation;
      let ay = (t * 0.6) + scrollRotation * 1.5;
      let az = (t * 0.1);

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
