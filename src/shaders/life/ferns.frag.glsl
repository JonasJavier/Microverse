// Parche de los helechos (fragmento), jornada 16: oscuros en la base (la sombra)
// y más claros hacia la punta de la fronda, que recibe la luz.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
varying float vFrond;
//#color
diffuseColor.rgb *= mix(0.55, 1.1, clamp(vFrond, 0.0, 1.0));
