import { ScrollScene } from 'scroll-scene';
import ThreeScene from './utils/THREE-utils';

const scene = new ThreeScene();
document.body.appendChild(scene.renderer.domElement);

// Handle window resize
window.addEventListener('resize', () => {
  scene.camera.aspect = window.innerWidth / window.innerHeight;
  scene.camera.updateProjectionMatrix();
  scene.renderer.setSize(window.innerWidth, window.innerHeight);
});

// Basic animation loop
const animate = () => {
  requestAnimationFrame(animate);
  scene.controls.update();
  scene.renderer.render(scene.scene, scene.camera);
};

animate();

// Initialize scroll animations
new ScrollScene({
  target: document.body,
  trigger: document.querySelector('.hero'),
  options: {
    offset: '0% 50%'
  },
  animations: [
    {
      selector: '.animated',
      style: 'opacity:1; transform:translateY(0)'
    }
  ]
});

// Load 3D model
const loader = new THREE.GLTFLoader();

loader.load('/assets/models/chicken-biryani.glb', (gltf) => {
  const model = gltf.scene;
  model.position.set(0, 0, 0);
  scene.scene.add(model);

  // Add more animations here
}, undefined, (error) => {
  console.error('Error loading model:', error);
});
