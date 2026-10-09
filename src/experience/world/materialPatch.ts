import type { IUniform, MeshStandardMaterial } from 'three'

/**
 * Parches GLSL sobre materiales estándar (ADR-006: shaders en archivos `.glsl`
 * importados con `?raw`). Un parche se divide en secciones con marcas `//#nombre`;
 * lo anterior a la primera marca son declaraciones. Puntos de inserción:
 *   vértice:   declaraciones → tras `common`; `main` → tras `begin_vertex`
 *   fragmento: declaraciones → tras `common`; `color` → tras `color_fragment`;
 *              `emissive` → tras `emissivemap_fragment`
 */
export function sections(source: string): Record<string, string> {
  const parts: Record<string, string> = {}
  let name = 'pars'
  for (const line of source.split('\n')) {
    const mark = /^\/\/#(\w+)/.exec(line)
    if (mark) name = mark[1]!
    else parts[name] = (parts[name] ?? '') + line + '\n'
  }
  return parts
}

const inc = (chunk: string) => `#include <${chunk}>`

export interface MaterialPatch {
  /** Clave de caché del programa: un parche distinto, un programa distinto. */
  key: string
  vertex: string
  /** Se concatenan: primero las funciones comunes (señales), luego el parche propio. */
  fragment: readonly string[]
  uniforms: Record<string, IUniform>
}

export function patchMaterial(material: MeshStandardMaterial, patch: MaterialPatch) {
  const vertex = sections(patch.vertex)
  const fragments = patch.fragment.map(sections)
  const join = (name: string) => fragments.map((f) => f[name] ?? '').join('\n')
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, patch.uniforms)
    shader.vertexShader = shader.vertexShader
      .replace(inc('common'), `${inc('common')}\n${vertex.pars ?? ''}`)
      .replace(inc('begin_vertex'), `${inc('begin_vertex')}\n${vertex.main ?? ''}`)
    shader.fragmentShader = shader.fragmentShader
      .replace(inc('common'), `${inc('common')}\n${join('pars')}`)
      .replace(inc('color_fragment'), `${inc('color_fragment')}\n${join('color')}`)
      .replace(inc('emissivemap_fragment'), `${inc('emissivemap_fragment')}\n${join('emissive')}`)
  }
  material.customProgramCacheKey = () => patch.key
  return material
}
