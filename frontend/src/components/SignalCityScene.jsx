import { useEffect, useRef } from "react";
import * as THREE from "three";

const BUILDINGS = [
  [-7, -3, 1.1, 1.8, 0.9],
  [-5.4, -1.2, 0.9, 3.2, 1.1],
  [-4.2, 2.1, 1.2, 2.4, 1],
  [-2.6, -2.5, 1, 4.2, 1.2],
  [-1.1, 0.2, 1.2, 2.8, 1.2],
  [0.7, -1.8, 1.1, 5.1, 1.1],
  [2.2, 1.5, 1, 3.5, 1],
  [3.8, -2.8, 1.4, 2.2, 1.2],
  [5.5, -0.5, 1.2, 4.5, 1.2],
  [6.8, 2.4, 0.9, 2.6, 1],
];

function createLabelSprite(text, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "600 36px Manrope, Arial, sans-serif";
  context.fillStyle = color;
  context.textAlign = "center";
  context.fillText(text, 256, 72);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.8, 0.95, 1);
  return sprite;
}

export default function SignalCityScene({ mode = "hero" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x07131b, 18, 42);

    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.set(0, 8.5, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xcde7ff, 1.2);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(-5, 9, 8);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xf0b86c, 50, 42);
    rimLight.position.set(8, 7, -7);
    scene.add(rimLight);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(9.4, 9.4, 0.35, 72),
      new THREE.MeshStandardMaterial({
        color: 0x102331,
        metalness: 0.42,
        roughness: 0.48,
      })
    );
    base.position.y = -0.22;
    group.add(base);

    const grid = new THREE.GridHelper(18, 18, 0x4ecdc4, 0x1a4052);
    grid.position.y = 0.01;
    group.add(grid);

    const buildingMaterials = [
      new THREE.MeshStandardMaterial({
        color: 0x163449,
        metalness: 0.35,
        roughness: 0.32,
        emissive: 0x071018,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x285767,
        metalness: 0.28,
        roughness: 0.36,
        emissive: 0x081a20,
      }),
    ];

    BUILDINGS.forEach(([x, z, width, height, depth], index) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        buildingMaterials[index % buildingMaterials.length]
      );
      mesh.position.set(x, height / 2, z);
      group.add(mesh);

      const signal = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 18, 18),
        new THREE.MeshStandardMaterial({
          color: index % 3 === 0 ? 0xf2b66d : 0x62e2d2,
          emissive: index % 3 === 0 ? 0xa35c15 : 0x0d8077,
          emissiveIntensity: 1.8,
        })
      );
      signal.position.set(x, height + 0.35, z);
      group.add(signal);
    });

    const curveMaterial = new THREE.LineBasicMaterial({
      color: mode === "hero" ? 0x62e2d2 : 0xf2b66d,
      transparent: true,
      opacity: 0.72,
    });

    for (let i = 0; i < BUILDINGS.length - 1; i += 1) {
      const a = BUILDINGS[i];
      const b = BUILDINGS[i + 1];
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(a[0], a[3] + 0.45, a[1]),
        new THREE.Vector3((a[0] + b[0]) / 2, 6.4 + (i % 2), (a[1] + b[1]) / 2),
        new THREE.Vector3(b[0], b[3] + 0.45, b[1]),
      ]);
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)), curveMaterial));
    }

    const rings = [];
    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.7 + i * 2.1, 0.018, 12, 120),
        new THREE.MeshBasicMaterial({
          color: i === 1 ? 0xf2b66d : 0x62e2d2,
          transparent: true,
          opacity: 0.36,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.08 + i * 0.03;
      group.add(ring);
      rings.push(ring);
    }

    const labels = [
      ["Demand", -6.2, 4.2, -3.8, "#62e2d2"],
      ["Risk", 2.4, 5.9, -4.5, "#f2b66d"],
      ["Growth", 4.8, 4.1, 3.8, "#e8f6f4"],
    ].map(([text, x, y, z, color]) => {
      const sprite = createLabelSprite(text, color);
      sprite.position.set(x, y, z);
      group.add(sprite);
      return sprite;
    });

    let frameId = 0;
    const clock = new THREE.Clock();

    function resize() {
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function animate() {
      const elapsed = clock.getElapsedTime();
      const scrollProgress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.6);

      group.rotation.y = elapsed * 0.08 + scrollProgress * 0.34;
      group.rotation.x = Math.sin(elapsed * 0.35) * 0.035;
      camera.position.x = Math.sin(elapsed * 0.18) * 1.2;
      camera.position.y = 8.5 - Math.min(scrollProgress, 1) * 1.8;
      camera.lookAt(0, 1.2, 0);

      rings.forEach((ring, index) => {
        ring.rotation.z = elapsed * (0.16 + index * 0.04);
        ring.scale.setScalar(1 + Math.sin(elapsed * 1.2 + index) * 0.025);
      });

      labels.forEach((label, index) => {
        label.position.y += Math.sin(elapsed * 1.5 + index) * 0.0018;
      });

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    }

    resize();
    animate();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frameId);
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      mount.removeChild(renderer.domElement);
    };
  }, [mode]);

  return <div className={`signal-city-scene signal-city-scene-${mode}`} ref={mountRef} aria-hidden="true" />;
}
