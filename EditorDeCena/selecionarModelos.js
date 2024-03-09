import { main, applyTransformations } from "./script.js";

const models = [
    { path: 'obj/archeryrange.obj' },
    { path: 'obj/bridge.obj' },
    { path: 'obj/castle.obj' },
    { path: 'obj/detail_hill.obj' },
    { path: 'obj/house.obj' },
    { path: 'obj/market.obj' },
    { path: 'obj/mill.obj' },
    { path: 'obj/well.obj' },
];

const nameModels = [
    "Campo de Tiro ao Alvo",
    "Ponte",    
    "Castelo",
    "Floresta e Colina",
    "Casa",
    "Mercadinho",
    "Moinho",
    "Poço",
]

let translation = [150, 100];
let rotation = [0, 1];
let scale = [1, 1];

export { models };

// Função para preencher a lista de modelos
function populateModelList() {
    const modelList = document.getElementById('list-models');
    const mainCanvas = document.getElementById('canvas');

    modelList.innerHTML = '';

    // Adiciona cada modelo à lista
    models.forEach((model, index) => {
        const listItem = document.createElement('li');
        console.log("Li foi criado", index);

        // Estilo dos itens
        listItem.style.display = "flex";
        listItem.style.alignItems = "center";
        listItem.style.justifyContent = "center";
        listItem.style.cursor = "pointer";

        // Cria um novo canvas para o modelo
        const canvas = document.createElement('canvas');
        canvas.id = 'canvas' + index;
        canvas.style.marginBottom = "10px";
        canvas.style.alignItems = "center";
        canvas.style.height = "130px";

        listItem.appendChild(canvas);
        modelList.appendChild(listItem);

        //const modelCanvasMap = new Map(); // Mapeia modelos para seus respectivos canvas

        // Adiciona cada canvas e modelo correspondente ao mapa
        //modelCanvasMap.set(model.path, canvas);

        listItem.addEventListener('click', () => {
            console.log("Index do item clicado:", index);
            console.log("Clicando em: ", nameModels[index]);

            const gl = canvas.getContext("webgl2");
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            translation = [150, 100];
            rotation = [0, 1];
            scale = [1, 1];

            main(model, mainCanvas, { translation, rotation, scale }); // Renderiza o modelo do canvas principal

            addSelectedModelToList(models, nameModels[index], index); // Adiciona o modelo na lista dos selecionados

            //resetSliders();

            event.stopPropagation(); // Evita que o evento clique seja propagado para o elemento pai
        });

        main(model, canvas, { translation, rotation, scale }); // Renderiza o modelo do canvas do item da lista
    });
}

window.addEventListener('load', populateModelList);

// Função para adicionar um modelo à lista de modelos selecionados
function addSelectedModelToList(models, modelName, index) {
    const selectedModelsList = document.getElementById('models-selected');
    const listItem = document.createElement('li');
    listItem.textContent = modelName;

    console.log("Modelo " + modelName + " foi selecionado");
    selectedModelsList.appendChild(listItem);

    listItem.addEventListener('click', () => {
        console.log('Modelo selecionado para editar transformações:', modelName);

        // Aplica as transformações ao modelo selecionado
        applyTransformations(models[index], translation, rotation, scale);
    });

}