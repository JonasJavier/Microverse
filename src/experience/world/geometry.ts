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
 * `distance` es la longitud por las conexiones desde la semilla, para los pulsos
 * y el crecimiento.
 */
export function toTubeGeometry(data: TubeMeshData) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(data.positions, 3))
  geometry.setAttribute('normal', new BufferAttribute(data.normals, 3))
  geometry.setAttribute('distance', new BufferAttribute(data.distances, 1))
  geometry.setIndex(new BufferAttribute(data.indices, 1))
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
