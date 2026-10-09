// Parche de los charcos (vértice), jornada 7. Solo existen al pasarse de agua:
// crecen desde nada con el encharcado. `vLocal` son coordenadas en el disco
// (radio 1) para el borde suave y las ondas.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
attribute float aPhase;
uniform float uPuddle;
varying vec2 vLocal;
varying float vPhase;
//#main
vLocal = transformed.xz;
vPhase = aPhase;
transformed *= uPuddle;
