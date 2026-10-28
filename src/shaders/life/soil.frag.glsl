// Parche del suelo (fragmento), jornada 11b · Realismo. La malla solo tiene
// colores por vértice (estratos): de cerca era una superficie lisa de plástico.
// Aquí se añade lo que tiene la tierra real y no cabe en los vértices:
//   - grano: manchas finas de albedo y rugosidad (ruido 3D en el fragmento);
//   - relieve: un campo de altura con el mismo ruido perturba la normal, así la
//     luz principal dibuja la textura (más en el corte, a contraluz);
//   - minerales: motas claras y escasas, como arena y mica en la arcilla.
// Jornada 17: los estratos se pintan aquí (uStrata), a partir de la profundidad
// por vértice: bandas nítidas con contacto oscuro entre capas, laminación en la
// arcilla, piedras en la tierra, vetas en la roca y rugosidad por capa. Separadas
// por valor y textura, no por tono (docs/02). `uDetail` (0..1) deja apagar el
// microdetalle en calidad baja; las bandas se pintan siempre. Usa surface.glsl.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
uniform float uDetail;
uniform float uGrainScale;
uniform float uBumpHeight;
uniform float uStrata;
uniform float uStrataDepths[5];
uniform vec3 uStrataColors[6];
varying float vDepth;
float soilGrain;
float strataLine;
float strataLam;
float strataArcilla;
float strataRoca;

// Peso de la capa `k` (0 césped … 5 roca) a partir del índice continuo de capa.
float strataWeight(float band, float k) {
  return smoothstep(k - 0.4, k, band) * (1.0 - smoothstep(k, k + 0.4, band));
}
//#color
{
  soilGrain = surfFbm(vSurfPos * uGrainScale);
  float fine = surfNoise(vSurfPos * uGrainScale * 6.0);
  strataLine = 0.0;
  strataLam = 0.0;
  strataArcilla = 0.0;
  strataRoca = 0.0;
  if (uStrata > 0.5) {
    // Las capas ondulan: la profundidad se perturba con un ruido ancho.
    float depth = vDepth + 0.03 * (surfFbm(vSurfPos * 5.0) - 0.5);
    vec3 band = uStrataColors[0];
    float index = 0.0;
    for (int k = 0; k < 5; k++) {
      float t = smoothstep(uStrataDepths[k] - 0.004, uStrataDepths[k] + 0.004, depth);
      band = mix(band, uStrataColors[k + 1], t);
      index += t;
      // Contacto: línea fina y oscura donde una capa apoya en la siguiente.
      float d = (depth - uStrataDepths[k]) / 0.0035;
      strataLine = max(strataLine, exp(-d * d));
    }
    strataArcilla = strataWeight(index, 3.0);
    strataRoca = smoothstep(4.6, 5.0, index);
    float tierra = strataWeight(index, 2.0) + strataWeight(index, 4.0);
    diffuseColor.rgb = band;
    // Arcilla: laminación fina, sedimento depositado capa a capa.
    // Suave y rota por ruido: si se lee como pana, es demasiado (A/B `estratos-v1`).
    strataLam = strataArcilla * (0.5 + 0.5 * sin(depth * 520.0 + 6.0 * surfNoise(vSurfPos * 30.0)));
    diffuseColor.rgb *= 1.0 - 0.07 * strataLam;
    // Piedras sueltas en la tierra: celdas claras del color de la roca.
    float stone = step(0.965, surfHash(floor(vSurfPos * uGrainScale * 2.5 + 0.5)));
    diffuseColor.rgb = mix(diffuseColor.rgb, uStrataColors[5] * 1.3, stone * tierra);
    // Roca: vetas oscuras (fracturas), más tumbadas que verticales.
    float vein = surfNoise(vSurfPos * vec3(14.0, 40.0, 14.0));
    float crack = smoothstep(0.44, 0.5, vein) * (1.0 - smoothstep(0.5, 0.56, vein));
    diffuseColor.rgb *= 1.0 - 0.3 * strataRoca * crack;
    diffuseColor.rgb *= 1.0 - 0.35 * strataLine;
    // Más hondo, menos luz llega: refuerza el orden de las capas.
    diffuseColor.rgb *= mix(1.0, 0.82, smoothstep(0.1, 0.6, depth));
  }
  diffuseColor.rgb *= mix(1.0, 0.78 + 0.42 * soilGrain + 0.12 * fine, uDetail);
  // Motas minerales: pocas, claras, del color del material (no blancas).
  float speck = step(0.985, surfHash(floor(vSurfPos * uGrainScale * 9.0)));
  diffuseColor.rgb *= 1.0 + 0.9 * speck * uDetail;
}
//#roughness
roughnessFactor *= mix(1.0, 0.88 + 0.2 * soilGrain, uDetail);
// La arcilla es más lisa (brilla al mojarse); la roca, algo menos áspera que la tierra.
roughnessFactor *= 1.0 - 0.22 * strataArcilla - 0.1 * strataRoca;
//#normal
{
  float h = uBumpHeight * (surfFbm(vSurfPos * uGrainScale * 1.5) + 0.35 * surfNoise(vSurfPos * uGrainScale * 7.0));
  // Roca: relieve más hondo. Laminación en relieve y contactos hundidos.
  h *= 1.0 + 0.8 * strataRoca;
  h += uBumpHeight * (0.25 * strataLam - 0.6 * strataLine);
  normal = surfBump(-vViewPosition, normal, h * uDetail);
}
