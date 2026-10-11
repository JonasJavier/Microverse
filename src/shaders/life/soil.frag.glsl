// Parche del suelo (fragmento), jornada 11b · Realismo. La malla solo tiene
// colores por vértice (estratos): de cerca era una superficie lisa de plástico.
// Aquí se añade lo que tiene la tierra real y no cabe en los vértices:
//   - grano: manchas finas de albedo y rugosidad (ruido 3D en el fragmento);
//   - relieve: un campo de altura con el mismo ruido perturba la normal, así la
//     luz principal dibuja la textura (más en el corte, a contraluz);
//   - minerales: motas claras y escasas, como arena y mica en la arcilla.
// `uDetail` (0..1) deja apagar el detalle en calidad baja. Usa surface.glsl.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
uniform float uDetail;
uniform float uGrainScale;
uniform float uBumpHeight;
float soilGrain;
//#color
{
  soilGrain = surfFbm(vSurfPos * uGrainScale);
  float fine = surfNoise(vSurfPos * uGrainScale * 6.0);
  diffuseColor.rgb *= mix(1.0, 0.78 + 0.42 * soilGrain + 0.12 * fine, uDetail);
  // Motas minerales: pocas, claras, del color del material (no blancas).
  float speck = step(0.985, surfHash(floor(vSurfPos * uGrainScale * 9.0)));
  diffuseColor.rgb *= 1.0 + 0.9 * speck * uDetail;
}
//#roughness
roughnessFactor *= mix(1.0, 0.88 + 0.2 * soilGrain, uDetail);
//#normal
{
  float h = uBumpHeight * (surfFbm(vSurfPos * uGrainScale * 1.5) + 0.35 * surfNoise(vSurfPos * uGrainScale * 7.0));
  normal = surfBump(-vViewPosition, normal, h * uDetail);
}
