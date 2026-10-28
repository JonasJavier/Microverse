// Parche del follaje (vértice): distancia de la rama de cada mechón (atributo
// por instancia). Crecimiento (jornada 7): cada mechón brota cuando el frente de
// crecimiento llega a su rama; las nubes se llenan mechón a mechón. Viento
// (jornada 8): cada mechón se mece con un vaivén lento y una ráfaga más fina,
// más cuanto más lejos del tronco; con lluvia sopla algo más. Se usa también en
// el material de sombra: la sombra se mece igual. Jornada 11b: altura local del
// mechón (la base se oscurece: oclusión propia). Jornada 17: silueta propia por
// mechón y normal orientada desde el centro de su nube.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
attribute float pathDistance;
attribute vec3 cloudCenter;
varying float vDistance;
varying float vTuftHeight;
varying vec3 vSurfPos;
uniform float uGrowth;
uniform float uTreeStart;
uniform float uTreeLength;
uniform float uTime;
uniform float uWind;
uniform float uSeason;

float tuftHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
//#main
vDistance = pathDistance;
vTuftHeight = position.y;
{
  #ifdef USE_INSTANCING
  vec3 tuft = instanceMatrix[3].xyz;
  #else
  vec3 tuft = vec3(0.0);
  #endif
  // Silueta propia (jornada 17): cada vértice se desplaza radialmente según un
  // hash de su posición y la de su mechón. Los vértices duplicados comparten
  // posición: el poliedro sigue cerrado. Vale para el icosaedro y el octaedro.
  vec3 radial = normalize(position);
  float lump = tuftHash(position * 2.7 + tuft * 131.0) - 0.5;
  transformed += radial * lump * 0.6;
  // Los mechones que florecen (mismo hash que en el fragmento) son más pequeños:
  // una flor entre el follaje, no una mancha Sol del tamaño de un mechón.
  float pick = fract(sin(pathDistance * 912.37) * 43758.5453);
  transformed *= mix(1.0, 0.7, step(0.92, pick));

  float front = uTreeStart + uTreeLength * uGrowth;
  transformed *= smoothstep(pathDistance - 0.02, pathDistance + 0.1, front);
  // Invierno (jornada 15): la copa se aclara, cada mechón encoge un quinto.
  transformed *= 1.0 - 0.2 * exp(-pow((uSeason - 0.75) / 0.12, 2.0));
  // Posición del mechón en el árbol (columna de traslación de la instancia):
  // la fase del viento varía por el espacio, así la copa ondula, no vibra entera.
  float reach = clamp((pathDistance - uTreeStart) / max(uTreeLength, 0.001), 0.0, 1.0);
  float slow = sin(uTime * 0.9 + tuft.x * 4.0 + tuft.z * 3.0);
  float gust = sin(uTime * 2.7 + tuft.y * 6.0 + tuft.x * 9.0);
  // En espacio local del mechón (su escala ya está en la matriz): con brisa (0,5)
  // se mueve un tercio de su radio; con lluvia (1,3), casi uno entero.
  transformed.xz += vec2(slow * 0.5 + gust * 0.15, gust * 0.2) * uWind * (0.3 + 0.7 * reach);

  #ifdef USE_INSTANCING
  vSurfPos = (instanceMatrix * vec4(transformed, 1.0)).xyz;
  #else
  vSurfPos = transformed;
  #endif
  // Normal de nube (jornada 17): mira desde el centro de la nube, mezclada con
  // la del propio mechón. La nube se sombrea como un volumen blando (clara
  // arriba, oscura abajo, con la luz real) y los mechones solo ponen el borde.
  // El material de sombra no tiene normal: solo se escribe en el estándar
  // (`STANDARD` lo define three en su vértice; `DEPTH_PACKING` solo en fragmento).
  #ifdef STANDARD
  vec3 fromCloud = normalize(vSurfPos - cloudCenter);
  #ifdef USE_INSTANCING
  vec3 own = normalize(mat3(instanceMatrix) * radial);
  #else
  vec3 own = radial;
  #endif
  vNormal = normalize(normalMatrix * normalize(mix(fromCloud, own, 0.3)));
  #endif
}
