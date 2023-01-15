// import * as THREE from "three";
// import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// /**
//  * Create Hexagon Function
//  */
// let hexagonGeometries = new THREE.BoxGeometry(0, 0, 0);

// function hexagonGeometry(height, position) {
// 	const geometry = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
// 	geometry.translate(position.x, height * 0.5, position.y);

// 	return geometry;
// }

// // Merge hexagons into one geometry to reduce draw calls
// export default function makeHexagon(height, position) {
// 	const geometry = hexagonGeometry(height, position);
// 	hexagonGeometries = mergeBufferGeometries([hexagonGeometries, geometry]);
// }
