import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import type { FrameModel } from '../three/buildFrameModel';

function frameModelToGroup(model: FrameModel): THREE.Group {
  const group = new THREE.Group();
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0x2b2b30 });
  const lensMaterial = new THREE.MeshStandardMaterial({ color: 0xbcd9f2, transparent: true, opacity: 0.5 });

  group.add(new THREE.Mesh(model.rimRight, rimMaterial));
  group.add(new THREE.Mesh(model.rimLeft, rimMaterial));
  group.add(new THREE.Mesh(model.lensRight, lensMaterial));
  group.add(new THREE.Mesh(model.lensLeft, lensMaterial));
  group.add(new THREE.Mesh(model.templeRight, rimMaterial));
  group.add(new THREE.Mesh(model.templeLeft, rimMaterial));
  return group;
}

export function exportModelToGlb(model: FrameModel): Promise<ArrayBuffer> {
  const group = frameModelToGroup(model);
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      group,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else resolve(new TextEncoder().encode(JSON.stringify(result)).buffer as ArrayBuffer);
      },
      (error) => reject(error),
      { binary: true },
    );
  });
}

export function exportModelToObj(model: FrameModel): string {
  const group = frameModelToGroup(model);
  const exporter = new OBJExporter();
  return exporter.parse(group);
}

export function downloadBinaryFile(filename: string, data: ArrayBuffer, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
