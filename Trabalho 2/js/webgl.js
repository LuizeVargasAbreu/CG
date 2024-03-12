"use strict";

export var vs = `#version 300 es

in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;
uniform mat4 u_world;

uniform vec3 u_lightWorldPosition;
uniform vec3 u_viewWorldPosition;

out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

void main() {
  gl_Position = u_worldViewProjection * a_position;

  v_normal = mat3(u_worldInverseTranspose) * a_normal;

  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;

}
`;

export var fs = `#version 300 es

precision highp float;

in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;
uniform float u_shininess;

uniform float u_ambientIntensity;         // Intensidade da luz ambiente
uniform float u_diffuseIntensity;         // Intensidade da luz difusa
uniform float u_pointLightIntensity;      // Intensidade da luz pontual
uniform float u_toonThreshold;            // Limiar do toon shader

out vec4 outColor;

void main() {
  vec3 normal = normalize(v_normal);

  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

  float light = dot(normal, u_reverseLightDirection);
  float pointLight = dot(normal, surfaceToLightDirection);
  float specular = 0.0;
  if (pointLight > 0.0) {
    specular = pow(dot(normal, halfVector), u_shininess);
  }

  // Ajustando a cor final usando as intensidades das luzes
  vec3 ambientColor = u_color.rgb * u_ambientIntensity;
  vec3 diffuseColor = u_color.rgb * u_diffuseIntensity * light;
  vec3 pointLightColor = u_color.rgb * u_pointLightIntensity * pointLight; 

  //Toon Shader
  float intensity = dot(normalize(v_normal), normalize(u_reverseLightDirection));
  float toon = 0.0;
  if (u_toonThreshold >= 0.0) {
    toon = floor(intensity / u_toonThreshold) * u_toonThreshold;
  }
  vec3 toonColor = vec3(toon);

  vec3 finalColor = ambientColor + diffuseColor + specular + pointLightColor + toonColor;

  outColor = vec4(finalColor, u_color.a);
}
`;