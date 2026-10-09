import {
  BufferAttribute,
  BufferGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  type Material,
} from 'three'
import type { MeshData } from '../../generators/island.ts'
import type { ScatterResult } from '../../generators/scatter.ts'
import type { TubeMeshData } from '../../generators/tubes.ts'

/** Convierte los datos de un generador en una BufferGeometry con normales suaves. */
export function toGeometry(data: MeshData) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(data.positions, 3))
  geometry.setAttribute('color', new BufferAttribute(data.colors, 3))
  geometry.setIndex(new BufferAttribute(data.indices, 1))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

/**
 * Tubos del árbol o de las raíces. Las normales vienen del generador (exactas);
 * `pathDistance` es la longitud por las conexiones desde la semilla (pulsos y
 * crecimiento), `thickness` el radio del tubo y `nodeValue` un valor por nodo
 * (en las raíces, su carácter).
 */
export function toTubeGeometry(data: TubeMeshData, recomputeNormals = false) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(data.positions, 3))
  geometry.setAttribute('normal', new BufferAttribute(data.normals, 3))
  // `distance` es una función integrada de GLSL: el atributo se llama pathDistance.
  geometry.setAttribute('pathDistance', new BufferAttribute(data.distances, 1))
  geometry.setAttribute('thickness', new BufferAttribute(data.thicknesses, 1))
  geometry.setAttribute('nodeValue', new BufferAttribute(data.nodeValues, 1))
  geometry.setIndex(new BufferAttribute(data.indices, 1))
  // Con estrías en la corteza, las normales radiales del generador no valen.
  if (recomputeNormals) geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

/** InstancedMesh rellenado con el resultado de un reparto (una draw call). */
export function toInstancedMesh(
  geometry: BufferGeometry,
  material: Material,
  scatter: ScatterResult,
) {
  const mesh = new InstancedMesh(geometry, material, scatter.count)
  mesh.instanceMatrix.array.set(scatter.matrices)
  mesh.instanceMatrix.needsUpdate = true
  mesh.instanceColor = new InstancedBufferAttribute(scatter.colors, 3)
  mesh.computeBoundingSphere()
  // Nada repartido sobre la isla es interactivo.
  mesh.raycast = () => {}
  return mesh
}

export function disposeMesh(mesh: { geometry: BufferGeometry; material: Material | Material[] }) {
  mesh.geometry.dispose()
  for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
    material.dispose()
  }
}
