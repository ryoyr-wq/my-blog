// assets/js/rotating-cube.js
(function() {
  console.log("3D Wireframe Engine (Complex Objects) loaded");

  function initCube(containerId, scale = 1.0, type = "torus") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.display = "block";
    canvas.style.width = "100%";
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');

    let width, height;
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      width = container.clientWidth;
      height = width * 0.75;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resize);
    resize();

    // --- 形状生成ロジック ---
    let verts = [];
    let edges = [];

    if (type === "cube") {
      verts = [
        [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
        [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]
      ];
      edges = [
        [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]
      ];
    } else if (type === "torus") {
      // ドーナツ型生成
      const R = 2; // 中心からの距離
      const r = 0.8; // チューブの太さ
      const detailU = 20; // 円周方向の分割数
      const detailV = 12; // チューブ方向の分割数

      for (let i = 0; i < detailU; i++) {
        let u = (i / detailU) * Math.PI * 2;
        for (let j = 0; j < detailV; j++) {
          let v = (j / detailV) * Math.PI * 2;
          let x = (R + r * Math.cos(v)) * Math.cos(u);
          let y = (R + r * Math.cos(v)) * Math.sin(u);
          let z = r * Math.sin(v);
          verts.push([x, y, z]);
          
          // 辺の定義（メッシュ状に結ぶ）
          let curr = i * detailV + j;
          let nextU = ((i + 1) % detailU) * detailV + j;
          let nextV = i * detailV + ((j + 1) % detailV);
          edges.push([curr, nextU]);
          edges.push([curr, nextV]);
        }
      }
    } else if (type === "sphere") {
      // 球体生成
      const detail = 12;
      for (let i = 0; i <= detail; i++) {
        let lat = (i / detail) * Math.PI;
        for (let j = 0; j < detail; j++) {
          let lon = (j / detail) * Math.PI * 2;
          let x = Math.sin(lat) * Math.cos(lon) * 2;
          let y = Math.cos(lat) * 2;
          let z = Math.sin(lat) * Math.sin(lon) * 2;
          verts.push([x, y, z]);
          
          let curr = i * detail + j;
          if (i < detail) {
            let nextLat = (i + 1) * detail + j;
            let nextLon = i * detail + ((j + 1) % detail);
            edges.push([curr, nextLat]);
            edges.push([curr, nextLon]);
          }
        }
      }
    }

    const BASE_SCALE = (width / 10) * scale;

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
      return [width * 0.5 + x * BASE_SCALE, height * 0.5 - y * BASE_SCALE];
    }

    let t = 0;
    function animate() {
      ctx.clearRect(0, 0, width, height);
      
      const color = getComputedStyle(document.documentElement).getPropertyValue('--tw-prose-body') || '#888';
      ctx.strokeStyle = color; 
      ctx.lineWidth = 1; // 複雑な形なので線を少し細く
      ctx.globalAlpha = 0.6; // 透明感を出して重なりを見やすく

      const scrollRotation = window.scrollY * 0.003;
      let ax = (t * 0.3) + scrollRotation;
      let ay = (t * 0.5) + scrollRotation * 1.2;
      let az = (t * 0.2);

      let proj = verts.map(v => {
        let p = rotX(v, ax);
        p = rotY(p, ay);
        p = rotZ(p, az);
        return project(p);
      });

      edges.forEach(([i, j]) => {
        if (!proj[i] || !proj[j]) return;
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
