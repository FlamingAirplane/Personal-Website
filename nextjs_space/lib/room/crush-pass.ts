// The bit-crush step. The 3D room is rendered to a small off-screen image,
// then this full-screen pass snaps every pixel to the nearest palette colour
// with ordered (Bayer) dithering.

import * as THREE from 'three';
import { PALETTE_HEX } from './palette';
import { RS } from './room-settings';

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D tScene;
  uniform vec3 uPalette[${PALETTE_HEX.length}];
  uniform float uDither;
  varying vec2 vUv;

  const float BAYER[16] = float[16](
    0.0, 8.0, 2.0, 10.0,
    12.0, 4.0, 14.0, 6.0,
    3.0, 11.0, 1.0, 9.0,
    15.0, 7.0, 13.0, 5.0
  );

  void main() {
    // The scene image holds linear light; the palette is in screen colours.
    vec3 color = pow(clamp(texture2D(tScene, vUv).rgb, 0.0, 1.0), vec3(1.0 / 2.2));

    ivec2 p = ivec2(gl_FragCoord.xy);
    float threshold = BAYER[(p.y & 3) * 4 + (p.x & 3)];
    color = clamp(color + (threshold - 7.5) * uDither / 255.0, 0.0, 1.0);

    vec3 best = uPalette[0];
    float bestDist = 1e9;
    for (int i = 0; i < ${PALETTE_HEX.length}; i++) {
      vec3 d = color - uPalette[i];
      // Weighted towards how the eye sees brightness.
      float dist = dot(d * d, vec3(3.0, 4.0, 2.0));
      if (dist < bestDist) {
        bestDist = dist;
        best = uPalette[i];
      }
    }
    gl_FragColor = vec4(best, 1.0);
  }
`;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export interface CrushPass {
  scene: THREE.Scene;
  camera: THREE.Camera;
  setSource(texture: THREE.Texture): void;
  dispose(): void;
}

export function createCrushPass(): CrushPass {
  // Raw 0..1 screen-colour values; deliberately not THREE.Color, which
  // would convert them to linear light.
  const palette = PALETTE_HEX.map(
    (hex) =>
      new THREE.Vector3(
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
      ),
  );

  const material = new THREE.ShaderMaterial({
    uniforms: {
      tScene: { value: null },
      uPalette: { value: palette },
      uDither: { value: RS.dither },
    },
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(geometry, material);
  quad.frustumCulled = false;

  const scene = new THREE.Scene();
  scene.add(quad);

  return {
    scene,
    camera: new THREE.Camera(),
    setSource(texture) {
      material.uniforms.tScene.value = texture;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
