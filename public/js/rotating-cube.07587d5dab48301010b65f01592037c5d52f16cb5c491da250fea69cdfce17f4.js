// assets/js/rotating-cube.js
(function() {
  console.log("3D Wireframe Engine (Icosahedron Update) loaded");

  function initCube(containerId, scale = 1.0, type = "icosahedron") {
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
    } else if (type === "icosahedron") {
      // 正二十面体の定義
      const phi = (1 + Math.sqrt(5)) / 2; // 黄金比
      
      // 12個の頂点
      verts = [
        [-1,  phi,  0], [ 1,  phi,  0], [-1, -phi,  0], [ 1, -phi,  0],
        [ 0, -1,  phi], [ 0,  1,  phi], [ 0, -1, -phi], [ 0,  1, -phi],
        [ phi,  0, -1], [ phi,  0,  1], [-phi,  0, -1], [-phi,  0,  1]
      ];

      // 30本の辺（距離が一定以下の頂点同士を結ぶ）
      for (let i = 0; i < verts.length; i++) {
        for (let j = i + 1; j < verts.length; j++) {
          const d2 = Math.pow(verts[i][0]-verts[j][0], 2) + 
                     Math.pow(verts[i][1]-verts[j][1], 2) + 
                     Math.pow(verts[i][2]-verts[j][2], 2);
          // 距離の2乗が約4になるペアが辺
          if (d2 < 4.1) {
            edges.push([i, j]);
          }
        }
      }
    } else if (type === "torus") {
      const R = 2, r = 0.8, detailU = 20, detailV = 12;
      for (let i = 0; i < detailU; i++) {
        let u = (i / detailU) * Math.PI * 2;
        for (let j = 0; j < detailV; j++) {
          let v = (j / detailV) * Math.PI * 2;
          verts.push([ (R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v) ]);
          let curr = i * detailV + j;
          edges.push([curr, ((i + 1) % detailU) * detailV + j]);
          edges.push([curr, i * detailV + ((j + 1) % detailV)]);
        }
      }
    } else if (type === "sphere") {
      const detail = 12;
      for (let i = 0; i <= detail; i++) {
        let lat = (i / detail) * Math.PI;
        for (let j = 0; j < detail; j++) {
          let lon = (j / detail) * Math.PI * 2;
          verts.push([ Math.sin(lat) * Math.cos(lon) * 2, Math.cos(lat) * 2, Math.sin(lat) * Math.sin(lon) * 2 ]);
          let curr = i * detail + j;
          if (i < detail) {
            edges.push([curr, (i + 1) * detail + j]);
            edges.push([curr, i * detail + ((j + 1) % detail)]);
          }
        }
      }
    }

    const BASE_SCALE = (width / 8) * scale;

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
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.8;

      const scrollRotation = window.scrollY * 0.003;
      let ax = (t * 0.4) + scrollRotation;
      let ay = (t * 0.6) + scrollRotation * 1.1;
      let az = (t * 0.2);

      let proj = verts.map(v => {
        let p = rotX(v, ax);
        p = rotY(p, ay);
        p = rotZ(p, az);
        return project(p);
      });

      edges.forEach(([i, j]) => {
        if (!proj[i] || !proj[j]) return;
        ctx.beginPath();
        ctx.moveTo(proj[i][0], proj[i][1]);
        ctx.lineTo(proj[j][0], proj[j][1]);
        ctx.stroke();
      });

      t += 0.02;
      requestAnimationFrame(animate);
    }
    animate();
  }
  window.initCube = initCube;
})();
