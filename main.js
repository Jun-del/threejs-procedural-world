import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { tileToPosition } from "./js/utils.js";
import { createNoise2D } from "https://cdn.skypack.dev/simplex-noise";

const canvas = document.querySelector("canvas.webgl");

const scene = new THREE.Scene();
scene.background = new THREE.Color("#FFEECC");

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
camera.position.set(0, 40, 50);
// camera.position.set(-17, 31, 33);
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

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Environment Map
let envMap;
const MAX_HEIGHT = 15;

/**
 * Animate
 */
(async function () {
	// Environment Map
	let pmremGenerator = new THREE.PMREMGenerator(renderer);
	let envMapTexture = await new RGBELoader()
		.setDataType(THREE.FloatType)
		.loadAsync("./asset/envMap.hdr");
	envMap = pmremGenerator.fromEquirectangular(envMapTexture).texture;

	const noise2D = createNoise2D();

	// Make Hexagon Grid
	for (let i = -15; i <= 15; i++) {
		for (let j = -15; j <= 15; j++) {
			let position = tileToPosition(i, j);

			// Skip hexagons outside of radius (16)
			if (position.length() > 16) continue;

			let value2d = (noise2D(i * 0.1, j * 0.1) + 1) * 0.5;

			makeHexagon(value2d * MAX_HEIGHT, position);
		}
	}

	// Make Hexagon
	let hexagonMesh = new THREE.Mesh(
		hexagonGeometries,
		new THREE.MeshStandardMaterial({ envMap, flatShading: true })
	);
	scene.add(hexagonMesh);

	// Render Loop
	renderer.setAnimationLoop(() => {
		controls.update();
		renderer.render(scene, camera);
	});
})();

/**
 * Create Hexagon Function
 */
let hexagonGeometries = new THREE.BoxGeometry(0, 0, 0);

function hexagonGeometry(height, position) {
	const geometry = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
	geometry.translate(position.x, height * 0.5, position.y);

	return geometry;
}

// Merge hexagons into one geometry to reduce draw calls
function makeHexagon(height, position) {
	const geometry = hexagonGeometry(height, position);
	hexagonGeometries = mergeBufferGeometries([hexagonGeometries, geometry]);
}
