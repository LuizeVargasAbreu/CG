import { vs, fs } from "./webgl.js";
import { setGeometry, setNormals } from "./geometriaF.js";

let fRotationRadians = 0;
let fRotationPointRadians = 0;
let shininess = 150;
let ambientIntensity = 0.5;
let diffuseIntensity = 0.5;
let pointLightIntensity = 0.5;
let toonThreshold = 0.5;
let toonShaderEnabled = false;
let animation = false;

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  var program = webglUtils.createProgramFromSources(gl, [vs, fs]);

  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var normalAttributeLocation = gl.getAttribLocation(program, "a_normal");

  // look up uniform locations
  var worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
  var worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
  var colorLocation = gl.getUniformLocation(program, "u_color");
  var reverseLightDirectionLocation = gl.getUniformLocation(program, "u_reverseLightDirection");
  var lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
  var worldLocation = gl.getUniformLocation(program, "u_world");
  var viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");
  var shininessLocation = gl.getUniformLocation(program, "u_shininess");
  var toonThresholdLocation = gl.getUniformLocation(program, "u_toonThreshold");

  var positionBuffer = gl.createBuffer();
  var vao = gl.createVertexArray();

  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl);

  var size = 3;          // 3 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  setNormals(gl);

  gl.enableVertexAttribArray(normalAttributeLocation);
  gl.vertexAttribPointer(normalAttributeLocation, size, type, normalize, stride, offset);

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);

  drawScene();

  document.getElementById("ambientSlider").addEventListener("input", function (event) {
    ambientIntensity = parseFloat(event.target.value);
    document.getElementById("ambientValue").textContent = ambientIntensity;
    drawScene();
  });

  document.getElementById("diffuseSlider").addEventListener("input", function (event) {
    diffuseIntensity = parseFloat(event.target.value);
    document.getElementById("diffuseValue").textContent = diffuseIntensity;
    drawScene();
  });

  document.getElementById("pointLightSlider").addEventListener("input", function (event) {
    pointLightIntensity = parseFloat(event.target.value);
    document.getElementById("pointValue").textContent = pointLightIntensity;
    drawScene();
  });

  document.getElementById("shininessSlider").addEventListener("input", function (event) {
    shininess = parseFloat(event.target.value);
    document.getElementById("shininessValue").textContent = shininess;
    drawScene();
  });

  document.getElementById("toggleToonShader").addEventListener("click", function () {
    toonShaderEnabled = !toonShaderEnabled; // Inverte o estado do toon shader
    console.log("Cliquei no botão!", toonShaderEnabled);
    drawScene();
  });

  document.getElementById("animation").addEventListener("click", function () {
    animation = !animation;
    if (animation) {
      console.log("Com animação.");
      animate();
    } else {
      console.log("Sem animação.");
    }
    drawScene();
  });

  function animate() {
    if (animation) {
      fRotationRadians += degToRad(1);
      drawScene();
      requestAnimationFrame(animate);
    }
  }

  // Draw the scene.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    // Compute the matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    // Compute the camera's matrix
    var camera = [100, 150, 200];
    var target = [0, 35, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(camera, target, up);

    var viewMatrix = m4.inverse(cameraMatrix);
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // Draw a F at the origin with rotation
    var worldMatrix = m4.yRotation(fRotationRadians);
    var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
    var worldInverseMatrix = m4.inverse(worldMatrix);
    var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

    // Set the matrices
    gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
    gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);

    // Set the color to use
    gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green

    // set the light direction.
    gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));
    gl.uniform3fv(lightWorldPositionLocation, [Math.cos(fRotationPointRadians) * 50, Math.sin(fRotationPointRadians) * 50, 60]); // Adicionado para controlar a posição da luz pontual

    // set the camera/view position
    gl.uniform3fv(viewWorldPositionLocation, camera);

    // set the shininess
    gl.uniform1f(shininessLocation, shininess);

    // Set the light intensities
    gl.uniform1f(gl.getUniformLocation(program, "u_ambientIntensity"), ambientIntensity);
    gl.uniform1f(gl.getUniformLocation(program, "u_diffuseIntensity"), diffuseIntensity);
    gl.uniform1f(gl.getUniformLocation(program, "u_pointLightIntensity"), pointLightIntensity);

    if (toonShaderEnabled) {
      gl.uniform1f(toonThresholdLocation, toonThreshold);
      console.log("IF Toon Shader ligado...", toonShaderEnabled);
    } else {
      gl.uniform1f(toonThresholdLocation, -1.0);
      console.log("ELSE Toon Shader desligado...", toonShaderEnabled);
    }

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}

main();
