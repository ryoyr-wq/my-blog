// assets/js/rotating-cube.js
(function() {
  console.log("Rotating Cube script loaded");

  function initCube(containerId, scale = 1.0) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error("Container not found:", containerId);
      return;
    }

    const canvas = document.createElement('canvas');
    // キャンバスを確実に見えるようにスタイルを当てる
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
    canvas.style.border = "1px solid #ccc"; // デバッグ用：枠線を表示
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');

    let width, height;
    function resize() {
      // 親コンテナの幅を取得し、高さは 4:3 に固定
      width = container.clientWidth || 400;
      height = width * 0.75;
      canvas.width = width;
      canvas.height = height;
      console.log("Canvas resized to:", width, height);
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
      
      // 色を強制的に「赤」にして、まずは見えるかどうか確認する
      // (うまく映ったら、後でテーマに合わせた色に戻せます)
      ctx.strokeStyle = "#ff0000"; 
      ctx.lineWidth = 3;

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

      t += 0.05;
      requestAnimationFrame(animate);
    }

    animate();
  }

  // グローバルに登録（ショートコードから呼べるようにする）
  window.initCube = initCube;
  console.log("initCube function registered");
})();
