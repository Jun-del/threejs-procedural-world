import * as THREE from "three";
import { Scene } from "three";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Convert tile coordinates to world position
 * @param {*} tileX
 * @param {*} tileY
 * @returns Vector2
 */
function tileToPosition(tileX, tileY) {
	return new THREE.Vector2((tileX + (tileY % 2) * 0.5) * 1.77, tileY * 1.535);
}

/**
 * Create Hexagon Geometry Function
 * @param {*} height
 * @param {*} position
 * @returns THREE.CylinderGeometry
 */
function hexagonGeometry(height, position) {
	const geometry = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
	geometry.translate(position.x, height * 0.5, position.y);

	return geometry;
}

/**
 * Create a hexagon mesh
 * @param {*} geometry
 * @param {*} textureMap
 * @param {*} envMap
 * @returns THREE.Mesh (Hexagon)
 */
function hexagonMesh(geometry, textureMap, envMap) {
	let material = new THREE.MeshPhysicalMaterial({
		envMap,
		// envMapIntensity: 0.135,
		envMapIntensity: 0.135,
		flatShading: true,
		map: textureMap,
	});

	let mesh = new THREE.Mesh(geometry, material);
	mesh.castShadow = true;
	mesh.receiveShadow = true;

	return mesh;
}

/**
 * Color Picker
 * @param {*} color
 * @returns THREE.Color
 */
function colorPicker(color) {
	return new THREE.Color(color);
}

/**
 * Create a stone
 * @param {*} height
 * @param {*} position
 * @returns THREE.SphereGeometry
 */
function createStone(height, position) {
	const px = Math.random() * 0.4;
	const pz = Math.random() * 0.4;

	// radius, widthSegments, heightSegments (0.1 - 0.4 radius)
	const geometry = new THREE.SphereGeometry(Math.random() * 0.3 + 0.1, 7, 7);
	geometry.translate(position.x + px, height, position.y + pz);

	return geometry;
}

/**
 * Create a tree
 * @param {*} height
 * @param {*} position
 * @returns THREE.Geometry
 */
function createTree(height, position) {
	const treeHeight = Math.random() * 1 + 1.25;

	// Three cylinders to model a tree
	const geometry = new THREE.CylinderGeometry(0, 1.5, treeHeight, 3);
	geometry.translate(position.x, height + treeHeight * 0 + 1, position.y);

	const geometry2 = new THREE.CylinderGeometry(0, 1.15, treeHeight, 3);
	geometry2.translate(position.x, height + treeHeight * 0.6 + 1, position.y);

	const geometry3 = new THREE.CylinderGeometry(0, 0.8, treeHeight, 3);
	geometry3.translate(position.x, height + treeHeight * 1.25 + 1, position.y);

	return mergeBufferGeometries([geometry, geometry2, geometry3]);
}

/**
 * Create a cloud
 * @param {*} envmap
 * @returns THREE.Geometry
 */
function createCloud(envmap, scene) {
	let geometry = new THREE.SphereGeometry(0, 0, 0);
	let count = Math.floor(Math.pow(Math.random(), 0.45) * 4);

	for (let i = 0; i < count; i++) {
		const puff1 = new THREE.SphereGeometry(1.2, 7, 7);
		const puff2 = new THREE.SphereGeometry(1.5, 7, 7);
		const puff3 = new THREE.SphereGeometry(0.9, 7, 7);

		puff1.translate(-1.85, Math.random() * 0.3, 0);
		puff2.translate(0, Math.random() * 0.3, 0);
		puff3.translate(1.85, Math.random() * 0.3, 0);

		const cloudGeometry = mergeBufferGeometries([puff1, puff2, puff3]);
		cloudGeometry.translate(
			Math.random() * 20 - 10,
			Math.random() * 10 + 10,
			Math.random() * 20 - 10
		);
		cloudGeometry.rotateY(Math.random() * Math.PI * 2);

		geometry = mergeBufferGeometries([geometry, cloudGeometry]);
	}

	const mesh = new THREE.Mesh(
		geometry,
		new THREE.MeshStandardMaterial({
			envMap: envmap,
			envMapIntensity: 0.75,
			flatShading: true,
			transparent: true,
			opacity: 0.9,
		})
	);

	scene.add(mesh);
}

export {
	tileToPosition,
	hexagonGeometry,
	hexagonMesh,
	colorPicker,
	createStone,
	createTree,
	createCloud,
};
