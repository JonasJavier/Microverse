// Parche del suelo y del musgo (fragmento), jornada 7. Cuánto les afecta lo
// decide cada material (uWetAmount, uWiltAmount).
//   Humedad: la tierra mojada se oscurece y brilla (menos rugosidad).
//   Marchitez: el musgo seco pierde el verde hacia un tono de hoja seca.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
uniform float uWet;
uniform float uWilt;
uniform vec3 uDryColor;
uniform float uWetAmount;
uniform float uWiltAmount;
uniform float uPuddle;
//#color
{
  float luma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  diffuseColor.rgb = mix(diffuseColor.rgb, uDryColor * (0.55 + 1.2 * luma), uWilt * uWiltAmount);
  diffuseColor.rgb *= mix(1.0, 0.6, uWet * uWetAmount);
  // Encharcado: la tierra saturada se apaga aún más y se vuelve lisa (el aviso de exceso).
  diffuseColor.rgb *= mix(1.0, 0.72, uPuddle * uWetAmount);
}
//#roughness
roughnessFactor *= mix(1.0, 0.45, uWet * uWetAmount) * mix(1.0, 0.6, uPuddle * uWetAmount);
