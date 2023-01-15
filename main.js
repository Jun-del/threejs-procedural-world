import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { tileToPosition } from "./js/utils.js";

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

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Environment Map
let envMap;

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

	// Make Hexagon Grid
	for (let i = 0; i < 20; i++) {
		for (let j = 0; j < 20; j++) {
			makeHexagon(3, tileToPosition(i, j));
		}
	}

	// Make Hexagon
	makeHexagon(3, new THREE.Vector2(0, 0));
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
