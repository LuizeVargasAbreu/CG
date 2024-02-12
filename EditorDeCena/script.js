import { vs, fs } from "./js/webgl.js";
import { parseOBJ, parseMTL } from "./js/carregarObj.js";
import { degToRad, getGeometriesExtents } from "./js/utils.js";

export async function main(model, canvas, { translation, rotation, scale }) {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */

    //const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }

    twgl.setAttributePrefix("a_");
    const meshProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const objHref = model.path;
    const response = await fetch(objHref);
    const text = await response.text();
    const obj = parseOBJ(text);

    const baseHref = new URL(objHref, window.location.href);
    const matTexts = await Promise.all(obj.materialLibs.map(async filename => {
        const matHref = new URL(filename, baseHref).href;
        const response = await fetch(matHref);
        return await response.text();
    }));
    const materials = parseMTL(matTexts.join('\n'));

    const parts = obj.geometries.map(({ material, data }) => {
        if (data.color) {
            if (data.position.length === data.color.length) {
                data.color = { numComponents: 3, data: data.color };
            }
        } else {
            data.color = { value: [1, 1, 1, 1] };
        }

        const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
        const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);
        return {
            material: materials[material],
            bufferInfo,
            vao,
        };
    });

    const extents = getGeometriesExtents(obj.geometries);
    const range = m4.subtractVectors(extents.max, extents.min);
    const objOffset = m4.scaleVector(
        m4.addVectors(
            extents.min,
            m4.scaleVector(range, 0.5)),
        -1);

    const cameraTarget = [0, 0, 0];
    const radius = m4.length(range) * 1.2;
    const cameraPosition = m4.addVectors(cameraTarget, [
        0,
        0,
        radius,
    ]);

    const zNear = radius / 100;
    const zFar = radius * 3;

    // Setup a ui.
    webglLessonsUI.setupSlider("#x", { value: translation[0], slide: updatePosition(0), max: gl.canvas.width });
    webglLessonsUI.setupSlider("#y", { value: translation[1], slide: updatePosition(1), max: gl.canvas.height });
    webglLessonsUI.setupSlider("#rotation", { slide: updateAngle, max: 360 });
    webglLessonsUI.setupSlider("#scalaX", { value: scale[0], slide: updateScale(0), min: -5, max: 5, step: 0.01, precision: 2 });
    webglLessonsUI.setupSlider("#scalaY", { value: scale[1], slide: updateScale(1), min: -5, max: 5, step: 0.01, precision: 2 });

    function updatePosition(index) {
        return function (event, ui) {
            translation[index] = ui.value;
            applyTransformations(model, translation, rotation, scale);
        };
    }

    function updateAngle(event, ui) {
        var angleInDegrees = 360 - ui.value;
        var angleInRadians = angleInDegrees * Math.PI / 180;
        rotation[0] = Math.sin(angleInRadians);
        rotation[1] = Math.cos(angleInRadians);
        applyTransformations(model, translation, rotation, scale);
    }

    function updateScale(index) {
        return function (event, ui) {
            scale[index] = ui.value;
            applyTransformations(model, translation, rotation, scale);
        };
    }

    function render(time) {
        time *= 0.001;  // convert to seconds

        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);

        const fieldOfViewRadians = degToRad(60);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        const up = [0, 1, 0];
        const camera = m4.lookAt(cameraPosition, cameraTarget, up);
        const view = m4.inverse(camera);

        const sharedUniforms = {
            u_lightDirection: m4.normalize([-1, 3, 5]),
            u_view: view,
            u_projection: projection,
            u_viewWorldPosition: cameraPosition,
        };

        gl.useProgram(meshProgramInfo.program);
        twgl.setUniforms(meshProgramInfo, sharedUniforms);

        let u_world = m4.yRotation(time);
        u_world = m4.translate(u_world, ...objOffset);
        m4.xRotate(u_world, degToRad(rotation), u_world);
        m4.translate(u_world, translation[0], translation[1], u_world);
        m4.scale(u_world, scale, u_world);

        const mainCanvas = canvas.id === "canvas";

        for (const { bufferInfo, vao, material } of parts) {
            gl.bindVertexArray(vao);

            let modelMatrix = m4.identity();
            if (!mainCanvas) {
                modelMatrix = m4.yRotation(time);
            }
            modelMatrix = m4.translate(modelMatrix, ...objOffset);

            twgl.setUniforms(meshProgramInfo, {
                u_world: modelMatrix,
            }, material);
            twgl.drawBufferInfo(gl, bufferInfo);
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

// Função que aplica as transformações no modelo
export function applyTransformations(model, translation, rotation, scale) {
    // Atualize as transformações do modelo com base nos parâmetros fornecidos
    model.translation = translation;
    model.rotation = rotation;
    model.scale = scale;

    // Renderize o modelo com as novas transformações
    renderModel(model);
}

function renderModel(model) {
    const gl = model.canvas.getContext("webgl2");
    if (!gl) {
        return;
    }

    const meshProgramInfo = model.meshProgramInfo;
    const parts = model.parts;
    const objOffset = model.objOffset;
    const translation = model.translation;
    const rotation = model.rotation;
    const scale = model.scale;
    const cameraPosition = model.cameraPosition;
    const cameraTarget = model.cameraTarget;
    const zNear = model.zNear;
    const zFar = model.zFar;
    const time = performance.now() * 0.001; // Convertendo para segundos

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);

    const fieldOfViewRadians = degToRad(60);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const up = [0, 1, 0];
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);
    const view = m4.inverse(camera);

    const sharedUniforms = {
        u_lightDirection: m4.normalize([-1, 3, 5]),
        u_view: view,
        u_projection: projection,
        u_viewWorldPosition: cameraPosition,
    };

    gl.useProgram(meshProgramInfo.program);
    twgl.setUniforms(meshProgramInfo, sharedUniforms);

    let u_world = m4.yRotation(time);
    u_world = m4.translate(u_world, ...objOffset);
    m4.xRotate(u_world, degToRad(rotation), u_world);
    m4.translate(u_world, translation[0], translation[1], u_world);
    m4.scale(u_world, scale, u_world);

    for (const { bufferInfo, vao, material } of parts) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(meshProgramInfo, {
            u_world,
        }, material);
        twgl.drawBufferInfo(gl, bufferInfo);
    }

    requestAnimationFrame(() => renderModel(model));
}
