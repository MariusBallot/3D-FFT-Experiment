import * as THREE from "three";
import {BloomEffect, EffectComposer, EffectPass, RenderPass} from "postprocessing";
import OrbitControls from "orbit-controls-es6";
import SoundReactor from "mb-sound-reactor";

class ThreeScene {
  constructor() {
    this.camera;
    this.scene;
    this.renderer;
    this.cube;
    this.controls;
    this.uniforms;
    this.soundReactor = new SoundReactor();
    this.strands = [];
    this.flag = true;
    this.clock = new THREE.Clock();
    this.fft3D = new THREE.Group();

    this.composer;
    this.effectPass;
    this.bloom = new BloomEffect();

    this.bind();
    this.init();
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 10);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = true;
    this.controls.maxDistance = 1500;
    this.controls.minDistance = 0;

    console.log(this.bloom);
    this.effectPass = new EffectPass(this.camera, this.bloom);
    this.effectPass.renderToScreen = true;

    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(this.effectPass);

    this.uniforms = {
      colorB: {
        type: "vec3",
        value: new THREE.Color(0xacb6e5)
      },
      colorA: {
        type: "vec3",
        value: new THREE.Color(0x74ebd5)
      }
    };

    const det = 0.2;
    const size = 4;
    for (let x = -size / 2; x <= size / 2; x += det) {
      for (let z = -size / 2; z <= size / 2; z += det) {
        const cube = new THREE.Mesh(new THREE.BoxBufferGeometry(det, 1, det), new THREE.MeshPhongMaterial({reflectivity: 1, color: 0xffaaff}));
        cube.position.set(x, 0, z);
        this.strands.push(cube);
        this.fft3D.add(cube);
      }
    }

    this.scene.add(this.fft3D);
    let light = new THREE.AmbientLight();
    let pointLight = new THREE.PointLight();
    pointLight.position.set(10, 10, 0);
    this.scene.add(light, pointLight);
  }

  update() {
    this.renderer.render(this.scene, this.camera);
    if (!this.flag) {
      this.soundReactor.update();
      for (let i = 0; i < this.strands.length; i++) {
        this.strands[i].scale.y = this.soundReactor.fdata[i] / 100;
        this.strands[i].material.color = new THREE.Color(255, this.soundReactor.fdata[i] / 255, 255);
      }
    }

    this.composer.render(this.clock.getDelta());
    this.fft3D.rotateY(0.01);
    this.fft3D.rotateX(0.005);
  }

  resizeCanvas() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  bind() {
    this.resizeCanvas = this.resizeCanvas.bind(this);
    window.addEventListener("resize", this.resizeCanvas);
    window.addEventListener("click", () => {
      if (this.flag) {
        this.soundReactor.init();
        this.flag = false;
      }
    });
  }
}

export {
  ThreeScene as
  default
};
