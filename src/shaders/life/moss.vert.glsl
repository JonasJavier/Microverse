// Parche del musgo (vértice), jornada 11b. Altura local dentro de la almohadilla
// (−1 abajo, 1 arriba) y posición en el mundo para el grano.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
varying float vPadHeight;
varying vec3 vSurfPos;
//#main
vPadHeight = position.y;
#ifdef USE_INSTANCING
vSurfPos = (instanceMatrix * vec4(transformed, 1.0)).xyz;
#else
vSurfPos = transformed;
#endif
