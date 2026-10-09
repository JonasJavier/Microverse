// Parche de las raíces sobre MeshStandardMaterial (vértice). Dos secciones:
// declaraciones (tras el chunk common) y cuerpo (tras el chunk begin_vertex),
// separadas por la marca de sección "main". RootNetwork.tsx las inserta.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
attribute float thickness;
varying float vThickness;
//#main
vThickness = thickness;
