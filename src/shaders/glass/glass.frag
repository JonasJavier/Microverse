// Cristal de pared fina (ADR-004).
// Una pared fina casi no desvía la luz: lo que se ve detrás pasa intacto, salvo una
// ligera absorción en los bordes. Lo que vende el cristal es la luz reflejada:
//   salida = reflejo · F  +  fondo · (1 − absorción)
// Se mezcla con alpha premultiplicado (ONE, ONE_MINUS_SRC_ALPHA): rgb suma el
// reflejo y alpha oscurece lo que hay detrás. Una sola pasada, sin render extra.
// Jornada 11b: halo tenue alrededor de cada reflejo (`uSheen`) y limbo claro en
// la silueta (`uLimb`), lo que distingue una esfera de vidrio de un disco.

#define MAX_SOFTBOXES 4

uniform vec3 uSoftboxDir[MAX_SOFTBOXES];
uniform vec3 uSoftboxTangent[MAX_SOFTBOXES];
uniform vec3 uSoftboxBitangent[MAX_SOFTBOXES];
uniform vec4 uSoftboxShape[MAX_SOFTBOXES]; // halfW, halfH, radio de esquina, suavidad
uniform vec3 uSoftboxColor[MAX_SOFTBOXES]; // color lineal × intensidad
uniform int uSoftboxCount;

uniform float uF0;
uniform float uReflection;
uniform vec3 uRimColor;
uniform float uRimStrength;
uniform float uRimPower;
uniform float uAbsorption;
uniform float uFaceFactor;
uniform float uSheen;
uniform float uLimb;
// Anillo del pedestal (jornada 11b): corona circular justo debajo de la esfera.
// Tangente de su radio visto desde el centro (0,48 / 1,2) y anchura del reflejo.
uniform vec3 uRingColor;
uniform float uRingTan;
uniform float uRingWidth;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Softboxes rectangulares en el infinito: se proyecta la dirección reflejada sobre
// el plano de cada softbox y se evalúa un rectángulo redondeado con borde suave.
vec3 studio(vec3 r, float grazing) {
  vec3 light = vec3(0.0);
  for (int i = 0; i < MAX_SOFTBOXES; i++) {
    if (i >= uSoftboxCount) break;
    float facing = dot(r, uSoftboxDir[i]);
    // Umbral > 0: si facing → 0, p → ∞ y ∞·0 da NaN, que el bloom esparce por toda
    // la pantalla. Un softbox visto de canto no aporta reflejo de todas formas.
    if (facing <= 0.01) continue;
    vec3 p = r / facing;
    vec2 local = vec2(dot(p, uSoftboxTangent[i]), dot(p, uSoftboxBitangent[i]));
    vec4 shape = uSoftboxShape[i];
    float d = sdRoundBox(local, shape.xy, shape.z);
    float mask = 1.0 - smoothstep(-shape.w, shape.w, d);
    // Como un softbox real: el centro quema un poco más que los bordes.
    float hotspot = mix(1.35, 0.75, smoothstep(0.0, 1.0, length(local / shape.xy)));
    // Halo: la luz se difumina en el cristal más allá del borde del softbox. De
    // anchura fija (no por suavidad: el rebote del suelo, muy suave, velaba
    // media esfera) y solo mientras el softbox está de cara (facing).
    float halo = (1.0 - smoothstep(-shape.w, 0.45, d)) * smoothstep(0.1, 0.5, facing);
    light += uSoftboxColor[i] * (mask * hotspot + halo * uSheen);
  }
  // El anillo del pedestal: se refleja como un arco fino en la parte baja del
  // cristal (Sol de día, Vida de noche) y asienta la esfera sobre su luz. Es un
  // anillo, no un softbox: con un rectángulo blando desde abajo, media esfera
  // quedaba velada de color cálido.
  // Solo en la cara delantera (uFaceFactor 1) y solo cerca de la silueta: en la
  // cara interior, y en el centro de la esfera (que actúa de espejo convexo), se
  // proyectaba como una elipse completa flotando dentro del cristal.
  float down = -r.y;
  if (down > 0.05 && uFaceFactor > 0.5) {
    vec2 local = r.xz / down;
    float d = abs(length(local) - uRingTan);
    light += uRingColor * (1.0 - smoothstep(0.0, uRingWidth, d)) * pow(grazing, 3.0);
  }
  return light;
}

void main() {
  vec3 v = normalize(cameraPosition - vWorldPosition);
  // En una pared fina, la normal útil es siempre la que mira a la cámara (en la cara
  // trasera, hacia el centro). No se usa gl_FrontFacing: con side = BackSide, three.js
  // invierte el winding y gl_FrontFacing vale true también en la cara trasera.
  vec3 n = faceforward(normalize(vWorldNormal), -v, normalize(vWorldNormal));
  float cosTheta = clamp(dot(n, v), 0.0, 1.0);
  float grazing = 1.0 - cosTheta;

  // Fresnel de Schlick.
  float fresnel = uF0 + (1.0 - uF0) * pow(grazing, 5.0);

  vec3 reflected = studio(reflect(-v, n), grazing) * fresnel * uReflection;
  vec3 rim = uRimColor * uRimStrength * pow(grazing, uRimPower);
  // Limbo: banda fina y clara justo antes de la silueta (reflexión interna total).
  vec3 limb = uRimColor * uLimb * smoothstep(0.7, 0.97, grazing);

  vec3 color = (reflected + rim + limb) * uFaceFactor;
  float alpha = clamp(uAbsorption * pow(grazing, 3.0) * uFaceFactor, 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
