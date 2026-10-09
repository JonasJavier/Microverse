// Señales de la red de vida (jornada 6). Funciones compartidas por los parches
// de raíces, corteza y follaje; los uniforms son los mismos objetos en los tres
// materiales (experience/signals.ts). `d` es la distancia por las conexiones
// desde la semilla.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
uniform float uIgnition;
uniform float uPhase;
uniform float uWavelength;
uniform float uLife;
uniform float uFlash;
uniform vec3 uSolColor;
uniform vec3 uVidaColor;
// Sincronía (0 → 1 → 0): los pulsos dejan de viajar y toda la red late a la vez.
uniform float uSync;

// 1 por detrás del frente de encendido, 0 por delante (y mientras duerme).
float signalLit(float d) {
  if (uIgnition < 0.0) return 0.0;
  return 1.0 - smoothstep(uIgnition - 0.12, uIgnition, d);
}

// Chispa en el frente: una gota de luz cálida que corre por la red.
float signalSpark(float d) {
  if (uIgnition < 0.0) return 0.0;
  float x = (d - uIgnition) / 0.05;
  return exp(-x * x);
}

// Tren de pulsos que se aleja de la semilla. Frente nítido y cola que se apaga;
// el carácter del nodo (0..1) decide la respuesta: 0 = destello breve y vivo,
// 1 = respuesta lenta y tenue. Así la red no late como un circuito.
float signalPulse(float d, float temperament) {
  float local = fract(uPhase - mix(d / uWavelength, 0.0, uSync));
  float tail = mix(0.025, 0.11, temperament);
  float gain = mix(1.0, 0.38, temperament);
  float behind = exp(-(local * local) / (tail * tail));
  float ahead = exp(-((1.0 - local) * (1.0 - local)) / (0.012 * 0.012));
  return gain * max(behind, ahead);
}
