import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { tileToPosition, hexagonGeometry, hexagonMesh } from "./js/utils.js";
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
// camera.position.set(0, 40, 50);
camera.position.set(-17, 31, 33);
// scene.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true,
});
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Lights
 */
const pointLight = new THREE.PointLight(
	new THREE.Color("#B3E1E9").convertSRGBToLinear().convertSRGBToLinear(),
	80,
	200
);
pointLight.position.set(10, 20, 10);

pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 512;
pointLight.shadow.mapSize.height = 512;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 20;
scene.add(pointLight);

const pointLightCameraHelper = new THREE.CameraHelper(pointLight.shadow.camera);
scene.add(pointLightCameraHelper);
pointLightCameraHelper.visible = false;

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.dampingFactor = 0.05;
controls.enableDamping = true;

// Environment Map
let envMap;

const MAX_HEIGHT = 10;
const textureLoader = new THREE.TextureLoader();

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

	// Load Textures
	const textures = {
		dirt: await textureLoader.loadAsync("./asset/textures/dirt.png"),
		dirt2: await textureLoader.loadAsync("./asset/textures/dirt2.jpg"),
		grass: await textureLoader.loadAsync("./asset/textures/grass.jpg"),
		sand: await textureLoader.loadAsync("./asset/textures/sand.jpg"),
		water: await textureLoader.loadAsync("./asset/textures/water.jpg"),
		stone: await textureLoader.loadAsync("./asset/textures/stone.png"),
	};

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

	const dirtMesh = hexagonMesh(dirtGeometry, textures.dirt, envMap);
	const dirt2Mesh = hexagonMesh(dirt2Geometry, textures.dirt2, envMap);
	const grassMesh = hexagonMesh(grassGeometry, textures.grass, envMap);
	const sandMesh = hexagonMesh(sandGeometry, textures.sand, envMap);
	// Water
	const stoneMesh = hexagonMesh(stoneGeometry, textures.stone, envMap);

	scene.add(stoneMesh, dirtMesh, dirt2Mesh, sandMesh, grassMesh);

	// Render Loop
	renderer.setAnimationLoop(() => {
		controls.update();
		renderer.render(scene, camera);
	});
})();

/**
 * Create Hexagon Function
 */

// function hexagonGeometry(height, position) {
// 	const geometry = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
// 	geometry.translate(position.x, height * 0.5, position.y);

// 	return geometry;
// }

const STONE_HEIGHT = MAX_HEIGHT * 0.8;
const DIRT_HEIGHT = MAX_HEIGHT * 0.7;
const GRASS_HEIGHT = MAX_HEIGHT * 0.5;
const SAND_HEIGHT = MAX_HEIGHT * 0.3;
const DIRT2_HEIGHT = MAX_HEIGHT * 0;

let stoneGeometry = new THREE.BoxGeometry(0, 0, 0);
let dirtGeometry = new THREE.BoxGeometry(0, 0, 0);
let dirt2Geometry = new THREE.BoxGeometry(0, 0, 0);
let sandGeometry = new THREE.BoxGeometry(0, 0, 0);
let grassGeometry = new THREE.BoxGeometry(0, 0, 0);

// Merge hexagons into one geometry to reduce draw calls
function makeHexagon(height, position) {
	let geometry = hexagonGeometry(height, position);

	if (height > STONE_HEIGHT) {
		stoneGeometry = mergeBufferGeometries([geometry, stoneGeometry]);
	} else if (height > DIRT_HEIGHT) {
		dirtGeometry = mergeBufferGeometries([geometry, dirtGeometry]);
	} else if (height > GRASS_HEIGHT) {
		grassGeometry = mergeBufferGeometries([geometry, grassGeometry]);
	} else if (height > SAND_HEIGHT) {
		sandGeometry = mergeBufferGeometries([geometry, sandGeometry]);
	} else if (height > DIRT2_HEIGHT) {
		dirt2Geometry = mergeBufferGeometries([geometry, dirt2Geometry]);
	}
}
