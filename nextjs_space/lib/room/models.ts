// Loading your own 3D models (.glb files).

import * as THREE from 'three';

const cache = new Map<string, Promise<THREE.Object3D>>();

/**
 * Load a .glb once and hand back a fresh copy each time. The loader is only
 * downloaded when a model is actually used.
 */
export function loadModel(url: string): Promise<THREE.Object3D> {
  let pending = cache.get(url);
  if (!pending) {
    pending = import('three/examples/jsm/loaders/GLTFLoader.js').then(
      ({ GLTFLoader }) =>
        new Promise<THREE.Object3D>((resolve, reject) => {
          new GLTFLoader().load(url, (gltf) => resolve(gltf.scene), undefined, reject);
        }),
    );
    cache.set(url, pending);
  }
  return pending.then((scene) => scene.clone(true));
}

export interface ModelPlacement {
  /** Scale to this height in metres first. 0 keeps the model's own size. */
  fitHeight: number;
  scale: number;
  x: number;
  y: number;
  z: number;
  /** Degrees. */
  rotY: number;
}

/**
 * Wrap a model so its bottom centre sits at the wrapper's origin, then scale,
 * turn and move it. Models come in with their origin anywhere; this makes
 * them stand on the floor where you put them.
 */
export function placeModel(model: THREE.Object3D, p: ModelPlacement): THREE.Group {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const fit = p.fitHeight > 0 && size.y > 0 ? p.fitHeight / size.y : 1;

  const inner = new THREE.Group();
  model.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  inner.add(model);

  const outer = new THREE.Group();
  outer.add(inner);
  outer.scale.setScalar(fit * p.scale);
  outer.position.set(p.x, p.y, p.z);
  outer.rotation.y = THREE.MathUtils.degToRad(p.rotY);
  return outer;
}
