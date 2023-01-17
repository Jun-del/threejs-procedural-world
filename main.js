import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { tileToPosition } from "./js/utils.js";
import { createNoise2D } from "https://cdn.skypack.dev/simplex-noise";
import { MeshPhysicalMaterial } from "three";

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
	shadowMap: {
		type: THREE.PCFSoftShadowMap,
	},
});
renderer.shadowMap.enabled = true;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Lights
 */
const pointLight = new THREE.PointLight(
	new THREE.Color("#FFCB8E").convertSRGBToLinear().convertSRGBToLinear(),
	80,
	200
);
pointLight.position.set(10, 20, 10);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 512;
pointLight.shadow.mapSize.height = 512;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 500;
scene.add(pointLight);

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Environment Map
let envMap;

// Textures
const MAX_HEIGHT = 10;
const STONE_HEIGHT = MAX_HEIGHT * 0.8;
const DIRT_HEIGHT = MAX_HEIGHT * 0.7;
const GRASS_HEIGHT = MAX_HEIGHT * 0.5;
const SAND_HEIGHT = MAX_HEIGHT * 0.3;
const DIRT2_HEIGHT = MAX_HEIGHT * 0;

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
		dirt: await new THREE.TextureLoader().loadAsync("./asset/textures/dirt.png"),
		dirt2: await new THREE.TextureLoader().loadAsync("./asset/textures/dirt2.jpg"),
		grass: await new THREE.TextureLoader().loadAsync("./asset/textures/grass.jpg"),
		sand: await new THREE.TextureLoader().loadAsync("./asset/textures/sand.jpg"),
		stone: await new THREE.TextureLoader().loadAsync("./asset/textures/stone.png"),
		water: await new THREE.TextureLoader().loadAsync("./asset/textures/water.jpg"),
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

	const stoneMesh = hexagonMesh(stoneGeometry, textures.stone);
	const dirtMesh = hexagonMesh(dirtGeometry, textures.dirt);
	const dirt2Mesh = hexagonMesh(dirt2Geometry, textures.dirt2);
	const sandMesh = hexagonMesh(sandGeometry, textures.sand);
	const grassMesh = hexagonMesh(grassGeometry, textures.grass);
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
let stoneGeometry = new THREE.BoxGeometry(0, 0, 0);
let dirtGeometry = new THREE.BoxGeometry(0, 0, 0);
let dirt2Geometry = new THREE.BoxGeometry(0, 0, 0);
let sandGeometry = new THREE.BoxGeometry(0, 0, 0);
let grassGeometry = new THREE.BoxGeometry(0, 0, 0);

function hexagonGeometry(height, position) {
	const geometry = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
	geometry.translate(position.x, height * 0.5, position.y);

	return geometry;
}

// Merge hexagons into one geometry to reduce draw calls
function makeHexagon(height, position) {
	let geometry = hexagonGeometry(height, position);

	if (height > STONE_HEIGHT) {
		stoneGeometry = mergeBufferGeometries([stoneGeometry, geometry]);
	} else if (height > DIRT_HEIGHT) {
		dirtGeometry = mergeBufferGeometries([dirtGeometry, geometry]);
	} else if (height > GRASS_HEIGHT) {
		dirt2Geometry = mergeBufferGeometries([dirt2Geometry, geometry]);
	} else if (height > SAND_HEIGHT) {
		sandGeometry = mergeBufferGeometries([sandGeometry, geometry]);
	} else if (height > DIRT2_HEIGHT) {
		grassGeometry = mergeBufferGeometries([grassGeometry, geometry]);
	}

	// switch (height) {
	// 	case height > STONE_HEIGHT:
	// 		stoneGeometry = mergeBufferGeometries([stoneGeometry, geometry]);
	// 		break;
	// 	case height > DIRT_HEIGHT:
	// 		dirtGeometry = mergeBufferGeometries([dirtGeometry, geometry]);
	// 		break;
	// 	case height > DIRT2_HEIGHT:
	// 		dirt2Geometry = mergeBufferGeometries([dirt2Geometry, geometry]);
	// 		break;
	// 	case height > SAND_HEIGHT:
	// 		sandGeometry = mergeBufferGeometries([sandGeometry, geometry]);
	// 		break;
	// 	case height > GRASS_HEIGHT:
	// 		grassGeometry = mergeBufferGeometries([grassGeometry, geometry]);
	// 		break;
	// }
}

function hexagonMesh(geometry, textureMap) {
	let material = new MeshPhysicalMaterial({
		envMap,
		flatShading: true,
		map: textureMap,
	});

	let mesh = new THREE.Mesh(geometry, material);
	mesh.castShadow = true;
	mesh.receiveShadow = true;

	return mesh;
}
