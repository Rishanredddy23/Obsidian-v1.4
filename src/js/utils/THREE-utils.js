import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class ThreeScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(new THREE.Color('#1a1a1a'));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera.position.set(0, 5, 10);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.directionLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionLight.position.set(5, 10, 5);
    this.directionLight.castShadow = true;

    this.directionLight.shadow.mapSize.width = 512;
    this.directionLight.shadow.mapSize.height = 512;
    this.directionLight.shadow.camera.near = 0.5;
    this.directionLight.shadow.camera.far = 100;

    this.scene.add(this.ambientLight, this.directionLight);

    this.cursorPosition = { x: 0, y: 0 };
  }

  // Add model loading and animation methods here
};

export default ThreeScene;
