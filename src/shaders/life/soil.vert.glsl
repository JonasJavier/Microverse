// Parche del suelo (vértice), jornada 11b: posición del objeto para el
// microdetalle del fragmento (shaders/life/surface.glsl). Jornada 17: la
// profundidad bajo la superficie (atributo) con la que se pintan los estratos.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
attribute float strataDepth;
varying vec3 vSurfPos;
varying float vDepth;
//#main
vSurfPos = transformed;
vDepth = strataDepth;
