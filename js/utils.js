import * as THREE from "three";

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
 * @returns THREE.Mesh
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

export { tileToPosition, hexagonGeometry, hexagonMesh, colorPicker };
