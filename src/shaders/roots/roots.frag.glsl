// Parche de las raíces sobre MeshStandardMaterial (fragmento). Tres secciones:
// declaraciones (tras el chunk common), "color" (tras color_fragment) y
// "emissive" (tras emissivemap_fragment). RootNetwork.tsx las inserta.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
//
// Raíces maestras (gruesas): cuerpo oscuro y borde luminoso → se leen como
// volumen, no como cable. Filamentos (finos): brillo uniforme y más tenue.
varying float vThickness;
uniform float uThin;
uniform float uThick;
uniform float uFilament;
float rootWeight;
//#color
rootWeight = smoothstep(uThin, uThick, vThickness);
diffuseColor.rgb *= mix(1.0, 0.5, rootWeight);
//#emissive
{
  float facing = abs(dot(normal, normalize(vViewPosition)));
  float rim = 0.12 + 1.1 * pow(1.0 - facing, 2.0);
  totalEmissiveRadiance *= mix(uFilament, rim, rootWeight);
}
