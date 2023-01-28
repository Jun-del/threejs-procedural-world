import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
	tileToPosition,
	hexagonGeometry,
	hexagonMesh,
	colorPicker,
	createStone,
	createTree,
	createCloud,
} from "./src/utils.js";
import { createNoise2D } from "https://cdn.skypack.dev/simplex-noise";

// envmap https://polyhaven.com/a/herkulessaulen

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
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.set(0, 40, 50);
camera.position.set(-17, 31, 33);

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
const pointLightColor = colorPicker("#FFCB8E");
const pointLight = new THREE.PointLight(
	pointLightColor.convertSRGBToLinear().convertSRGBToLinear(),
	1200,
	200
);
pointLight.position.set(10, 20, 10);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 512;
pointLight.shadow.mapSize.height = 512;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 30;
scene.add(pointLight);

// Light Helper
// const pointLightCameraHelper = new THREE.CameraHelper(pointLight.shadow.camera);
// scene.add(pointLightCameraHelper);
// pointLightCameraHelper.visible = true;

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.dampingFactor = 0.05;
controls.enableDamping = true;

// PMREMGenerator is used to generate a cube map from an equirectangular texture
let pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Environment Map
let envMap;

const MAX_HEIGHT = 10;

/**
 * Animate
 */
(async function () {
	let envMapTexture = await new RGBELoader().loadAsync("/envmap.hdr");
	envMap = pmremGenerator.fromEquirectangular(envMapTexture).texture;

	// Load Textures
	const textureLoader = new THREE.TextureLoader();
	const textures = {
		dirt: await textureLoader.loadAsync("/dirt.png"),
		dirt2: await textureLoader.loadAsync("/dirt2.jpg"),
		grass: await textureLoader.loadAsync("/grass.jpg"),
		sand: await textureLoader.loadAsync("/sand.jpg"),
		water: await textureLoader.loadAsync("/water.jpg"),
		stone: await textureLoader.loadAsync("/stone.png"),
	};

	const noise2D = new createNoise2D();

	// Make Hexagon Grid
	for (let i = -20; i <= 20; i++) {
		for (let j = -20; j <= 20; j++) {
			let position = tileToPosition(i, j);

			// Skip hexagons outside of radius (16)
			if (position.length() > 16) continue;

			let value2d = (noise2D(i * 0.1, j * 0.1) + 1) * 0.5;
			value2d = Math.pow(value2d, 1.5);

			makeHexagon(value2d * MAX_HEIGHT, position);
		}
	}

	const dirtMesh = hexagonMesh(dirtGeometry, textures.dirt, envMap);
	const dirt2Mesh = hexagonMesh(dirt2Geometry, textures.dirt2, envMap);
	const grassMesh = hexagonMesh(grassGeometry, textures.grass, envMap);
	const sandMesh = hexagonMesh(sandGeometry, textures.sand, envMap);
	const stoneMesh = hexagonMesh(stoneGeometry, textures.stone, envMap);

	scene.add(stoneMesh, dirtMesh, dirt2Mesh, sandMesh, grassMesh);

	let waterTexture = textures.water;
	waterTexture.repeat = new THREE.Vector2(1, 1);
	waterTexture.wrapS = THREE.RepeatWrapping;
	waterTexture.wrapT = THREE.RepeatWrapping;

	// Sea Mesh (Water)
	const seaMesh = new THREE.Mesh(
		new THREE.CylinderGeometry(17, 17, MAX_HEIGHT * 0.2, 50),
		new THREE.MeshPhysicalMaterial({
			envMap,
			color: colorPicker("#55aaff").convertSRGBToLinear().multiplyScalar(3),
			ior: 1.4,
			transmission: 1,
			transparent: true,
			thickness: 1.5,
			envMapIntensity: 0.2,
			roughness: 1,
			metalness: 0.025,
			roughnessMap: waterTexture,
			metalnessMap: waterTexture,
		})
	);
	seaMesh.receiveShadow = true;
	seaMesh.rotation.y = -Math.PI * 0.333 * 0.5;
	seaMesh.position.set(0, MAX_HEIGHT * 0.2 * 0.5, 0);
	scene.add(seaMesh);

	let mapContainer = new THREE.Mesh(
		// Cylinder slightly larger and taller than seaMesh
		new THREE.CylinderGeometry(17.1, 17.1, MAX_HEIGHT * 0.25, 50, 1, true),
		new THREE.MeshPhysicalMaterial({
			envMap,
			map: textures.dirt,
			envMapIntensity: 0.2,
			side: THREE.DoubleSide,
		})
	);
	mapContainer.receiveShadow = true;
	mapContainer.rotation.y = -Math.PI * 0.333 * 0.5;
	mapContainer.position.set(0, MAX_HEIGHT * 0.125, 0);
	scene.add(mapContainer);

	let mapFloor = new THREE.Mesh(
		new THREE.CylinderGeometry(18.5, 18.5, MAX_HEIGHT * 0.1, 50),
		new THREE.MeshPhysicalMaterial({
			envMap,
			map: textures.dirt2,
			envMapIntensity: 0.1,
			side: THREE.DoubleSide,
		})
	);
	mapFloor.receiveShadow = true;
	mapFloor.position.set(0, -MAX_HEIGHT * 0.05, 0);
	scene.add(mapFloor);

	// Clouds
	createCloud(envMap, scene);

	// Render Loop
	renderer.setAnimationLoop(() => {
		controls.update();
		renderer.render(scene, camera);
	});
})();

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

function makeHexagon(height, position) {
	let geometry = hexagonGeometry(height, position);
	let addStone = Math.random() > 0.8;
	let addTree = Math.random() > 0.8;

	switch (true) {
		case height > STONE_HEIGHT:
			stoneGeometry = mergeBufferGeometries([geometry, stoneGeometry]);
			if (addStone) {
				stoneGeometry = mergeBufferGeometries([stoneGeometry, createStone(height, position)]);
			}
			break;
		case height > DIRT_HEIGHT:
			dirtGeometry = mergeBufferGeometries([geometry, dirtGeometry]);
			if (addTree) {
				grassGeometry = mergeBufferGeometries([grassGeometry, createTree(height, position)]);
			}
			break;
		case height > GRASS_HEIGHT:
			grassGeometry = mergeBufferGeometries([geometry, grassGeometry]);
			break;
		case height > SAND_HEIGHT:
			sandGeometry = mergeBufferGeometries([geometry, sandGeometry]);
			if (addStone) {
				stoneGeometry = mergeBufferGeometries([stoneGeometry, createStone(height, position)]);
			}
			break;
		case height > DIRT2_HEIGHT:
			dirt2Geometry = mergeBufferGeometries([geometry, dirt2Geometry]);
			break;
	}
}
