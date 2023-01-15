import * as THREE from "three";
import { Color, FloatType } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const canvas = document.querySelector("canvas.webgl");

const scene = new THREE.Scene();
scene.background = new Color("#FFEECC");

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
	45,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
camera.position.set(0, 0, 50);
scene.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true,
	toneMapping: THREE.ACESFilmicToneMapping,
	outputEncoding: THREE.sRGBEncoding,
	physicalCorrectLights: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Environment Map
let envMap;

/**
 * Animate
 */
(async function () {
	renderer.setAnimationLoop(() => {
		let pmremGenerator = new THREE.PMREMGenerator(renderer);
		let envMapTexture = new RGBELoader()
			.setDataType(FloatType)
			.loadAsync("envMap.hdr");
		envMap = pmremGenerator.fromEquirectangular(envMapTexture).texture;

		/**
		 * Geometry
		 */
		let SphereGeometry = new THREE.SphereGeometry(1, 32, 32);
		let SphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		let Sphere = new THREE.Mesh(SphereGeometry, SphereMaterial);
		scene.add(Sphere);

		renderer.render(scene, camera);
	});
})();
