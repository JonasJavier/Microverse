// Parche de las raíces (vértice). Ver experience/world/materialPatch.ts.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
attribute float thickness;
attribute float pathDistance;
attribute float nodeValue;
varying float vThickness;
varying float vDistance;
varying float vTemperament;
//#main
vThickness = thickness;
vDistance = pathDistance;
vTemperament = nodeValue;
