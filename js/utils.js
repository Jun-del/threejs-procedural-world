import * as THREE from "three";

function tileToPosition(tileX, tileY) {
	return new THREE.Vector2((tileX + (tileY % 2) * 0.5) * 1.77, tileY * 1.535);
}

export { tileToPosition };
