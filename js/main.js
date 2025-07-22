/*******************************************************************/
/*                      Opciones Formulario                        */
/*******************************************************************/

const registro_vehiculos = document.querySelector("#registro_vehiculos");
const inspeccion_vehicular = document.querySelector("#inspeccion_vehicular");
const radioButtonsFormularios = document.querySelectorAll('input[name="opcion_formulario"]');

registro_vehiculos.classList.add('visible');
radioButtonsFormularios.forEach(radio => {
    radio.addEventListener('change', function () {
        if (this.value == "registro_vehiculos") {
            inspeccion_vehicular.classList.remove('visible');
            registro_vehiculos.classList.add('visible');
        } else {
            registro_vehiculos.classList.remove('visible');
            inspeccion_vehicular.classList.add('visible');
        }
    });
});


/*******************************************************************/
/*                  Formulario Registro de Vehículos               */
/*******************************************************************/

const camera = document.querySelector("#camera");
const video = document.querySelector("#video");

let currentStream;
let contador = 0;
let container_1 = "20FT";
let container_2 = "40FT";
let formInspeccion = "formulario";
let name_btn = {
    [container_1]: ["Precinto", "Tablero", "Ficho", "Hoja1", "Hoja2", "100%", "50%", "0%"],
    [container_2]: ["Precinto", "Tablero", "Ficho", "Hoja1", "Hoja2", "100%", "75%", "50%", "25%", "0%"],
    [formInspeccion]: ["Precinto", "Ficho", "Frontal", "Trasera", "Lado Derecho", "Lado Izquierdo"]
};

const dbName = 'registroPlacaDB';
const dbVersion = 1;
const request = indexedDB.open(dbName, dbVersion);

/*******************************************************************/
/*                   Crear la base de datos                        */
/*******************************************************************/
request.onupgradeneeded = function (event) {
    const db = event.target.result;

    // Crear la tienda de objetos para almacenar el formulario y las fotos
    if (!db.objectStoreNames.contains('history')) {
        const store = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_history', 'history', { unique: true });
    }
    if (!db.objectStoreNames.contains('registro')) {
        const store = db.createObjectStore('registro', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_fotoId', 'fotoId', { unique: true });
        store.createIndex('by_formId', 'formId', { unique: false });
    }
};

request.onerror = function (event) {
    //console.error('Error al abrir la base de datos', event.target.error);
};

request.onsuccess = function (event) {
    const db = event.target.result;
    //console.log('Base de datos abierta con éxito');
};

document.addEventListener('DOMContentLoaded', function () {
    // Aquí va la función que deseas ejecutar
    //console.log('La página ha cargado y el DOM está listo.');
    recuperarRegistro();
    recuperarInspeccion();
});

async function guardarRegistro(formDiv) {
    const request = indexedDB.open(dbName, dbVersion);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');

        // Guardar el formulario
        const getRequest = store.get(1);
        getRequest.onsuccess = function () {
            const formularioObject = {
                id: 1,
                history: formDiv.innerHTML
            };
            const formularioRequest = store.put(formularioObject);
            formularioRequest.onsuccess = function () {
                //console.log('Formulario guardado con éxito');
            };
        };
    }
}

function recuperarRegistro() {
    const request = indexedDB.open(dbName, dbVersion);
    const formDiv = document.getElementById('formulario');

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');

        const requestGet = store.get(1);
        requestGet.onsuccess = function (event) {
            const bodyObject = event.target.result;
            if (bodyObject) {
                formDiv.innerHTML = bodyObject.history;
            } else {
                //console.log('Body no encontrado');
            }
        };
    };
}

async function guardarInspeccion(formDiv) {
    const request = indexedDB.open(dbName, dbVersion);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');

        // Guardar el HTML completo
        const htmlContent = formDiv.innerHTML;

        // Obtener todos los inputs de tipo 'text' y sus valores
        const inputs = formDiv.querySelectorAll('input[type="text"]');
        const inputValues = {};

        inputs.forEach(input => {
            inputValues[input.name] = input.value;
        });

        // Obtener los valores de los radio buttons seleccionados
        const radioButtons = formDiv.querySelectorAll('input[type="radio"]:checked');
        const radioValues = {};

        radioButtons.forEach(radio => {
            radioValues[radio.name] = radio.value;  // Guardar el valor seleccionado por nombre
        });

        // Capturar el contenido del canvas como imagen
        const canvas = formDiv.querySelector('canvas');
        const signatureImage = canvas ? canvas.toDataURL("image/png") : null; // Si no hay canvas, es null

        // Guardar tanto el HTML, los valores de los inputs y la imagen del canvas
        const formularioObject = {
            id: 2,
            html: htmlContent,  // Guardamos el HTML del formulario
            inputValues: inputValues,  // Guardamos los valores de los inputs
            radioValues: radioValues,  // Guardamos los valores de los radio buttons
            signatureImage: signatureImage // Guardamos la imagen del canvas
        };

        const formularioRequest = store.put(formularioObject);
        formularioRequest.onsuccess = function () {
            console.log('Formulario guardado con éxito');
        };
    };
}

function recuperarInspeccion() {
    const request = indexedDB.open(dbName, dbVersion);
    const formDiv = document.getElementById('inspectionForm');

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');

        const requestGet = store.get(2);
        requestGet.onsuccess = function (event) {
            const bodyObject = event.target.result;
            if (bodyObject) {
                // Recuperar el HTML guardado
                formDiv.innerHTML = bodyObject.html;

                // Recuperar los valores de los inputs guardados
                const inputValues = bodyObject.inputValues;

                // Asignar los valores a los inputs correspondientes
                for (const key in inputValues) {
                    const input = formDiv.querySelector(`input[name="${key}"]`);
                    if (input) {
                        input.value = inputValues[key]; // Asignar el valor recuperado
                    }
                }

                // Recuperar los valores de los radio buttons
                const radioValues = bodyObject.radioValues;

                // Restaurar la selección de los radio buttons
                for (const name in radioValues) {
                    const radioButton = formDiv.querySelector(`input[name="${name}"][value="${radioValues[name]}"]`);
                    if (radioButton) {
                        radioButton.checked = true;  // Marcar el radio button correspondiente
                    }
                }

                // Si había una firma guardada, restaurarla en el canvas
                const signatureImage = bodyObject.signatureImage;
                const canvas = formDiv.querySelector('canvas');
                const ctx = canvas.getContext('2d');

                if (signatureImage) {
                    // Crear una imagen a partir de la cadena base64
                    const img = new Image();
                    img.src = signatureImage;
                    img.onload = function () {
                        ctx.drawImage(img, 0, 0); // Dibuja la imagen en el canvas
                    };
                }

                // Ahora restauramos los eventos de dibujo en el canvas para que el usuario pueda seguir escribiendo
                habilitarDibujo(canvas, ctx); // Activar los eventos de dibujo nuevamente
            } else {
                console.log('Body no encontrado');
            }
        };
    };
}

/*async function guardarInspeccion(formDiv) {
    const request = indexedDB.open(dbName, dbVersion);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');

        // Guardar el HTML completo
        const htmlContent = formDiv.innerHTML;

        // Obtener todos los inputs de tipo 'text' y sus valores
        const inputs = formDiv.querySelectorAll('input[type="text"]');
        const inputValues = {};

        inputs.forEach(input => {
            inputValues[input.name] = input.value;
        });

        // Guardar tanto el HTML como los valores de los inputs
        const formularioObject = {
            id: 2,
            html: htmlContent, // Guardamos el HTML del formulario
            inputValues: inputValues // Guardamos los valores de los inputs
        };

        const formularioRequest = store.put(formularioObject);
        formularioRequest.onsuccess = function () {
            //console.log('Formulario guardado con éxito');
        };
    };
}

function recuperarInspeccion() {
    const request = indexedDB.open(dbName, dbVersion);
    const formDiv = document.getElementById('inspectionForm');

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');

        const requestGet = store.get(2);
        requestGet.onsuccess = function (event) {
            const bodyObject = event.target.result;
            if (bodyObject) {
                // Recuperar el HTML guardado
                formDiv.innerHTML = bodyObject.html;

                // Recuperar los valores de los inputs guardados
                const inputValues = bodyObject.inputValues;

                // Asignar los valores a los inputs correspondientes
                for (const key in inputValues) {
                    const input = formDiv.querySelector(`input[name="${key}"]`);
                    if (input) {
                        input.value = inputValues[key]; // Asignar el valor recuperado
                    }
                }
            } else {
                //console.log('Body no encontrado');
            }
        };
    };
}


/*
async function guardarInspeccion(formDiv) {
    const request = indexedDB.open(dbName, dbVersion);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');

        // Guardar el formulario
        const getRequest = store.get(2);
        getRequest.onsuccess = function () {
            const formularioObject = {
                id: 2,
                history: formDiv.innerHTML
            };
            const formularioRequest = store.put(formularioObject);
            formularioRequest.onsuccess = function () {
                //console.log('Formulario guardado con éxito');
            };
        };
    }
}

function recuperarInspeccion() {
    const request = indexedDB.open(dbName, dbVersion);
    const formDiv = document.getElementById('inspectionForm');

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');

        const requestGet = store.get(2);
        requestGet.onsuccess = function (event) {
            const bodyObject = event.target.result;
            if (bodyObject) {
                formDiv.innerHTML = bodyObject.history;
            } else {
                //console.log('Body no encontrado');
            }
        };
    };
}*/

/*******************************************************************/
/*                       Crear la placa                            */
/*******************************************************************/

function agregarEntrada() {
    const placa = document.createElement('div');
    placa.className = 'modalPlaca';
    placa.innerHTML = `
        <div class="section_entrada">
            <label class="lb_placa"><span>Placa</span><input type="text" name="placa" id="textPlaca"></label>
        </div>
        <div class="radio-containers">
            <input type="radio" id="opcion1" name="grupo_containers" value="${container_1}">
            <label for="opcion1">🚚 ${container_1}</label>
            <input type="radio" id="opcion2" name="grupo_containers" value="${container_2}">            
            <label for="opcion2">🚚 ${container_2}</label>
        </div>
        <div class="text-contenedor"></div>
    `;
    mostrarAlerta("Crear Placa", placa.outerHTML, "AGREGAR", crearPlaca, "CANCELAR", closeAlert)

    const radioButtons = document.querySelectorAll('input[name="grupo_containers"]');
    const textoDiv = document.querySelector('.text-contenedor');

    radioButtons.forEach(radio => {
        radio.addEventListener('change', function () {
            const resultado = name_btn[this.value].join(' | ');
            textoDiv.textContent = resultado;
        });
    });
}

function crearPlaca() {
    const formulario = document.querySelector('#formulario');
    let placa = document.querySelector("#textPlaca");
    let container = document.querySelector('input[name="grupo_containers"]:checked');
    let error = document.querySelector(".errorAlert");
    const regex = /^[A-Za-z]{3}\d{3}$/;
    if (placa.value == "") {
        error.textContent = "Ups! Por favor, ingresa la placa.";
        error.classList.toggle("error-visible");
        placa.focus();
        hideError(error);
        return;
    } else if (!regex.test(placa.value.trim())) {
        error.textContent = "Ups! El formato de la placa es incorrecto. Debe ser 3 letras seguidas de 3 números.";
        error.classList.toggle("error-visible");
        hideError(error);
        placa.focus();
        return;
    } else if (!container) {
        error.textContent = "Ups! Debe seleccionar un contenedor.";
        error.classList.toggle("error-visible");
        hideError(error);
        return;
    } else if (formulario) {
        let placas = formulario.querySelectorAll('input[name="placa"]');
        for (let element of placas) {
            if (element.value.toLowerCase().trim() === placa.value.toLowerCase().trim()) {
                error.textContent = "Ups! Ya existe esta placa.";
                error.classList.toggle("error-visible");
                hideError(error);
                placa.focus();
                return;
            }
        }
    }
    crearPanelPlaca(placa.value.trim(), container.value);
    closeAlert();
    activeNotify("¡Placa creada correctamente!");
}

function hideError(error) {
    setTimeout(() => {
        if (error.checkVisibility()) {
            error.classList.toggle("error-visible");
        }
    }, 3000);
}

/*******************************************************************/
/*                     Crear Panel de Placa                        */
/*******************************************************************/

// Función para generar UUID
function generarUUID() {
    return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function crearPanelPlaca(placa, container) {
    const formId = generarUUID();
    const cant = name_btn[container].length;
    const formDiv = document.getElementById('formulario');
    const formPlaca = document.createElement('div');
    formPlaca.className = 'formPlaca';
    formPlaca.id = `formPlaca-${formId}`;
    formPlaca.innerHTML += `
        <div class="section_entrada"><label class="lb_placa"><span>Placa</span><input type="text" name="placa" value="${placa}" disabled></label>
            <div class="btn_entrada">🚚 ${container}</div>
        </div>
    `;
    const preview = document.createElement('div');
    preview.id = `${formId}${container}`;
    preview.classList.add("section_preview");
    preview.innerHTML += `
                ${[...Array(cant)].map((_, i) => `<div class="section_foto"><img id="preview-${formId}${i}" class="preview">
                <div class="buttons-foto" id="buttons-foto-${formId}${i}"><span>${name_btn[container][i]}</span>
                
                <input class="input-foto" id="foto-${formId}${i}" type="file" accept="image/*" onchange="previewImage(this)">
                <label class="btn_upload" for="foto-${formId}${i}">
                <div id="btn_upload-${formId}${i}"><img src="img/image-alt.svg"></div></label>
                <button id="btn_camera-${formId}${i}" class="btn_camera" onclick="startCamera('${formId}${i}', 'registro')"><img src="img/camera-alt.svg"></button></div></div>`).join('')}
                <div class="section_btns"><button class="btn_guardar" onclick="guardar('${formId}', '${container}')"><img src="img/file-zip.svg"> Guardar</button>
                <button class="btn_eliminar" onclick="eliminar('${formId}')"><img src="img/trash.svg"></button></div>
            `;
    formPlaca.appendChild(preview);
    formDiv.appendChild(formPlaca);
    actualizarFiltro()
    contador++;
    guardarRegistro(formDiv);
}

function actualizarFiltro() {
    filtrarPlacas();
}

function filtrarPlacas() {
    const filtro = document.getElementById('buscador').value.toLowerCase();
    const entradas = document.querySelectorAll('.formPlaca');

    entradas.forEach(entry => {
        const placaInput = entry.querySelector('input[type="text"]');
        const placaValor = placaInput.value.toLowerCase();
        entry.style.display = placaValor.includes(filtro) ? '' : 'none';
    });
}

/*******************************************************************/
/*                        Función Camara                           */
/*******************************************************************/

function startCamera(id, form) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            let btn_foto = document.querySelector("#btn_foto");
            currentStream = stream;
            video.classList.add("active");
            camera.srcObject = stream;
            btn_foto.setAttribute("dataId", id);
            btn_foto.setAttribute("dataForm", form);
        })
        .catch(error => {
            mostrarAlerta("ERROR", "Error accediendo a la cámara: " + error.message, "ACEPTAR", closeAlert)
        });
}

function close_video() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        document.getElementById("camera").srcObject = null;
    }
    video.classList.remove("active");
}

async function capture(stage) {
    let dataForm = stage.getAttribute("dataForm");
    if (dataForm == 'registro') {
        captureRegistro(stage);
    } else {
        captureInspeccion(stage);
    }
}

async function captureRegistro(stage) {
    let id = stage.getAttribute("dataId");
    let newStr = id.slice(0, -1);
    let pos = id.slice(-1);
    const formPlaca = document.getElementById(`formPlaca-${newStr}`);
    const placa = formPlaca.querySelector('input[type="text"]').value.trim();
    const container = formPlaca.querySelector('.section_preview').id.slice(-4);
    const video = document.getElementById("camera");
    const canvas = document.getElementById("snapshot");

    // Establece el tamaño del canvas igual al del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibuja el contenido del video en el canvas
    canvas.getContext('2d').drawImage(video, 0, 0);

    // Convierte el contenido del canvas en un Data URL (en base64)
    const dataURL = canvas.toDataURL('image/jpeg');

    // Muestra la imagen
    const preview = document.getElementById(`preview-${id}`);
    preview.src = dataURL;
    preview.classList.add("active");

    // Actualiza el estilo del botón de la cámara
    const buttons_foto = document.getElementById(`buttons-foto-${id}`);
    buttons_foto.style.background = "#147a00";

    // Convierte la imagen en un Blob
    imgtoBlob(preview.src)
        .then(({ blob, extension }) => {
            // Guardar la foto
            const fotoName = `foto-${name_btn[container][pos]}.${extension}`;
            guardarFotoEnIndexedDB(formPlaca.id, blob, placa.toUpperCase(), id, fotoName);
            const formDiv = document.getElementById('formulario');
            guardarRegistro(formDiv);
            close_video();
        })
        .catch(err => {
            console.error("Error:", err.message);
        });
}

async function previewImage(element) {
    const preview = document.getElementById(`preview-${element.id.split('-')[1]}`);
    const buttons_foto = document.getElementById(`buttons-foto-${element.id.split('-')[1]}`);
    let id = element.id.split('-')[1];
    const formPlaca = document.getElementById(`formPlaca-${id.slice(0, -1)}`);
    const placa = formPlaca.querySelector('input[type="text"]').value.trim();
    const container = formPlaca.querySelector('.section_preview').id.slice(-4);
    const pos = element.id.split('-')[1].slice(-1);
    const file = element.files[0];

    if (file) {
        const reader = new FileReader();
        reader.addEventListener('load', function () {
            preview.src = reader.result;
            preview.classList.add("active");
            buttons_foto.style.background = "#147a00";
        });

        reader.readAsDataURL(file);
    } else {
        preview.src = '';
        preview.classList.remove("active");
        buttons_foto.style.background = "#525f60";
    }
    // Convierte la imagen en un Blob
    imgtoBlob(file)
        .then(async ({ blob, extension }) => {
            // Guardar la foto
            const fotoName = `foto-${name_btn[container][pos]}.${extension}`;
            try {
                const mensaje = await guardarFotoEnIndexedDB(formPlaca.id, blob, placa.toUpperCase(), id, fotoName);
                console.log(mensaje);
                const formDiv = document.getElementById('formulario');
                guardarRegistro(formDiv);
                close_video();
            } catch (error) {
                console.error("Error al guardar la foto:", error);
            }
        })
        .catch(err => {
            console.error("Error:", err.message);
        });
}

async function imgtoBlob(imgInput) {
    return new Promise((resolve, reject) => {
        const allowedTypes = ['jpeg', 'jpg', 'png', 'svg'];

        // Base64 case
        if (typeof imgInput === 'string' && imgInput.startsWith('data:image/')) {
            // Captura tipos MIME más amplios (como svg+xml)
            const mimeMatch = imgInput.match(/^data:image\/([a-zA-Z0-9\+\.-]+);base64,/);
            let extension = mimeMatch ? mimeMatch[1].toLowerCase() : null;

            if (!extension) {
                return reject(new Error("No se pudo detectar el tipo MIME de la imagen base64."));
            }

            // Normalizar extensiones si es necesario
            if (extension === 'svg+xml') extension = 'svg';

            if (!allowedTypes.includes(extension)) {
                return reject(new Error(`Formato de imagen no permitido: ${extension}`));
            }

            const base64Data = imgInput.replace(/^data:image\/[a-zA-Z0-9\+\.-]+;base64,/, '');
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let j = 0; j < byteCharacters.length; j++) {
                byteNumbers[j] = byteCharacters.charCodeAt(j);
            }
            const byteArray = new Uint8Array(byteNumbers);
            resolve({
                blob: new Blob([byteArray], { type: `image/${extension}` }),
                extension
            });

            // File case
        } else if (imgInput instanceof File) {
            const extension = imgInput.name.split('.').pop().toLowerCase();

            if (!allowedTypes.includes(extension)) {
                return reject(new Error(`Formato de archivo no permitido: ${extension}`));
            }

            resolve({
                blob: imgInput,
                extension
            });

        } else {
            reject(new Error("Entrada no válida: debe ser una imagen base64 o un File"));
        }
    });
}

async function guardarFotoEnIndexedDB(formId, fotoBlob, placa, fotoId, fotoName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = (event) => {
            reject(`Error al abrir la base de datos: ${event.target.error}`);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['registro'], 'readwrite');
            const store = transaction.objectStore('registro');

            const fotoObject = {
                formId,
                placa,
                fotoId,
                fotoName,
                blob: fotoBlob,
                timestamp: new Date(),
            };

            const index = store.index('by_fotoId');
            const getRequest = index.get(fotoId);

            getRequest.onsuccess = function () {
                const resultado = getRequest.result;

                if (resultado) {
                    // Ya existe: actualizar
                    fotoObject.id = resultado.id; // mantener el mismo ID
                    const updateRequest = store.put(fotoObject);

                    updateRequest.onsuccess = function () {
                        console.log(`Foto ${fotoName} sobrescrita con éxito en IndexedDB`);
                        resolve(`Foto ${fotoName} actualizada`);
                    };

                    updateRequest.onerror = function (event) {
                        console.error(`Error al sobrescribir la foto ${fotoName}`);
                        reject(event.target.error);
                    };
                } else {
                    // No existe: agregar
                    const addRequest = store.add(fotoObject);

                    addRequest.onsuccess = function () {
                        console.log(`Foto ${fotoName} guardada con éxito en IndexedDB`);
                        activeNotify(`Foto ${fotoName} guardada con éxito`);
                        resolve(`Foto ${fotoName} guardada`);
                    };

                    addRequest.onerror = function (event) {
                        console.error(`Error al guardar la foto ${fotoName}`);
                        reject(event.target.error);
                    };
                }
            };

            getRequest.onerror = function (event) {
                console.error("Error al verificar si la foto existe en IndexedDB");
                reject(event.target.error);
            };

            transaction.oncomplete = () => {
                db.close();
            };

            transaction.onerror = (event) => {
                reject(`Error en la transacción: ${event.target.error}`);
            };
        };
    });
}

/*******************************************************************/
/*                       Descargar Archivos                        */
/*******************************************************************/

async function guardar(id, nuevo) {
    const div = document.getElementById(`formPlaca-${id}`);
    const placa = div.querySelector('input[type="text"]').value.trim();
    const imgElements = div.querySelectorAll('.preview');

    let imagenes = [];
    for (const img of imgElements) {
        if (img.src && img.src.trim() !== "") {
            imagenes.push(img.src);
        }
    }
    if (imagenes.length < 6) {
        let texto = 'Debes subir al menos 6 fotos. "Precinto", "Tablero", "Ficho", "Hoja1", "Hoja2", "100%"';
        mostrarAlerta("Alerta", texto, "ACEPTAR", closeAlert)
        return;
    }

    const zip = new JSZip();
    await agregarImagenesAlZip(imagenes, name_btn, nuevo, zip);

    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            //let nameZip = `placa-${placa.toUpperCase()}.zip`;
            let nameZip = `registro_${placa.toUpperCase()}_${fecha.value}.zip`;
            let texto = `¿ Quiere descargar como .ZIP las fotos de la placa ${placa.toUpperCase()} ?`;
            mostrarAlerta("Alerta", texto, "ACEPTAR", () => saveZip(content, nameZip, div), "CANCELAR", closeAlert)
        });
}

function saveZip(content, nameZip, div) {
    saveAs(content, nameZip);
    const filtro = document.getElementById('buscador');
    filtro.value = "";
    actualizarFiltro();
    procesarBorrado(div);
    activeNotify(`Placa procesada.`);
}

async function agregarImagenesAlZip(imagenes, name_btn, nuevo, zip) {
    const promesas = imagenes.map((imgSrc, i) =>
        imgtoBlob(imgSrc)
            .then(({ blob, extension }) => {
                zip.file(`foto-${name_btn[nuevo][i]}.${extension}`, blob);
            })
            .catch(err => {
                console.error(`Error en imagen ${i}:`, err.message);
            })
    );

    await Promise.all(promesas);
    console.log("✅ Todas las imágenes fueron agregadas al ZIP");
}

/*******************************************************************/
/*                       Eliminar FormPlaca                        */
/*******************************************************************/

function eliminar(id) {
    const div = document.getElementById(`formPlaca-${id}`);
    const placa = div.querySelector('input[type="text"]').value.trim();
    let texto = `¿ Deseas eliminar el registro de la placa ${placa.toUpperCase()} ?`;
    mostrarAlerta("Eliminar Placa", texto, "ACEPTAR", () => procesarBorrado(div), "CANCELAR", closeAlert);
}

async function procesarBorrado(div) {
    try {
        const resultado = await eliminarPorFormId(div.id);
        console.log(resultado);
        div.remove();
        const formDiv = document.getElementById('formulario');
        guardarRegistro(formDiv);
        closeAlert();
    } catch (error) {
        mostrarAlerta("Error", `Error durante el borrado: ${error}`, "ACEPTAR", closeAlert);
    }
}

async function eliminarPorFormId(formId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = (event) => {
            reject(`Error al abrir la base de datos: ${event.target.error}`);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['registro'], 'readwrite');
            const store = transaction.objectStore('registro');

            let eliminados = 0;

            // Asegúrate de que el índice 'by_formId' exista
            const index = store.index('by_formId');
            const range = IDBKeyRange.only(formId);
            const cursorRequest = index.openCursor(range);

            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    eliminados++;
                    cursor.continue();
                }
            };

            cursorRequest.onerror = (event) => {
                reject(`Error al recorrer los datos: ${event.target.error}`);
            };

            transaction.oncomplete = () => {
                db.close();
                resolve(`Se eliminaron ${eliminados} registros con formId = ${formId}`);
            };

            transaction.onerror = (event) => {
                reject(`Error en la transacción: ${event.target.error}`);
            };
        };
    });
}


/*******************************************************************/
/*                Formulario Inspección Vehicular                  */
/*******************************************************************/

function resetFechaHora() {
    const fecha = document.querySelector("#fecha");
    const hora = document.querySelector("#hora");

    fecha.value = new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    hora.value = new Date().toLocaleString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

resetFechaHora();

//actualizarReloj();
//setInterval(actualizarReloj, 1000);

document.querySelector("#resetForm").addEventListener("click", () => {
    procesarBorradoInspeccion();
})

/*******************************************************************/
/*                      FotosFormInspeccion                        */
/*******************************************************************/

function crearFotosFormInspeccion() {
    const formId = generarUUID();
    const cant = name_btn[formInspeccion].length;
    const formDiv = document.getElementById('fotos-formInspeccion');
    const fotosInspeccion = document.createElement('div');
    fotosInspeccion.className = 'fotosInspeccion';
    fotosInspeccion.id = `fotosInspeccion-${formId}`;

    const preview = document.createElement('div');
    preview.id = `${formId}`;
    preview.classList.add("section_preview");
    preview.innerHTML += `
        ${[...Array(cant)].map((_, i) => `<div class="section_foto"><img id="preview-${formId}${i}" class="preview">
            <div class="buttons-foto" id="buttons-foto-${formId}${i}"><span>${name_btn[formInspeccion][i]}</span>
            
            <input class="input-foto" id="foto-${formId}${i}" type="file" accept="image/*" onchange="previewImageFormInspeccion(this)">
            <label class="btn_upload" for="foto-${formId}${i}">
            <div type="button" id="btn_upload-${formId}${i}"><img src="img/image-alt.svg"></div></label>
            <button type="button" id="btn_camera-${formId}${i}" class="btn_camera" onclick="startCamera('${formId}${i}', 'inspeccion')"><img src="img/camera-alt.svg"></button></div></div>`).join('')}
        `;

    fotosInspeccion.appendChild(preview);
    formDiv.appendChild(fotosInspeccion);
}

async function captureInspeccion(stage) {
    let id = stage.getAttribute("dataId");
    let newStr = id.slice(0, -1);
    let pos = id.slice(-1);
    const fotosInspeccion = document.getElementById(`fotosInspeccion-${newStr}`);
    const video = document.getElementById("camera");
    const canvas = document.getElementById("snapshot");

    // Establece el tamaño del canvas igual al del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibuja el contenido del video en el canvas
    canvas.getContext('2d').drawImage(video, 0, 0);

    // Convierte el contenido del canvas en un Data URL (en base64)
    const dataURL = canvas.toDataURL('image/jpeg');

    // Muestra la imagen
    const preview = document.getElementById(`preview-${id}`);
    preview.src = dataURL;
    preview.classList.add("active");

    // Actualiza el estilo del botón de la cámara
    const buttons_foto = document.getElementById(`buttons-foto-${id}`);
    buttons_foto.style.background = "#147a00";

    // Convierte la imagen en un Blob
    imgtoBlob(preview.src)
        .then(({ blob, extension }) => {
            // Guardar la foto
            const fotoName = `foto-${name_btn[formInspeccion][pos]}.${extension}`;
            guardarFotoEnIndexedDB(fotosInspeccion.id, blob, "INSPECCION", id, fotoName);
            const formDiv = document.getElementById('inspectionForm');
            guardarInspeccion(formDiv);
            close_video();
        })
        .catch(err => {
            console.error("Error:", err.message);
        });
}

async function previewImageFormInspeccion(element) {
    const preview = document.getElementById(`preview-${element.id.split('-')[1]}`);
    const buttons_foto = document.getElementById(`buttons-foto-${element.id.split('-')[1]}`);
    let id = element.id.split('-')[1];
    const formPlaca = document.getElementById(`fotosInspeccion-${id.slice(0, -1)}`);
    const pos = element.id.split('-')[1].slice(-1);
    const file = element.files[0];

    if (file) {
        const reader = new FileReader();
        reader.addEventListener('load', function () {
            preview.src = reader.result;
            preview.classList.add("active");
            buttons_foto.style.background = "#147a00";
        });

        reader.readAsDataURL(file);
    } else {
        preview.src = '';
        preview.classList.remove("active");
        buttons_foto.style.background = "#525f60";
    }
    // Convierte la imagen en un Blob
    imgtoBlob(file)
        .then(async ({ blob, extension }) => {
            // Guardar la foto
            const fotoName = `foto-${name_btn[formInspeccion][pos]}.${extension}`;
            try {
                const mensaje = await guardarFotoEnIndexedDB(formPlaca.id, blob, "INSPECCION", id, fotoName);
                console.log(mensaje);
                const formDiv = document.getElementById('inspectionForm');
                guardarInspeccion(formDiv);
                close_video();
            } catch (error) {
                console.error("Error al guardar la foto:", error);
            }
        })
        .catch(err => {
            console.error("Error:", err.message);
        });
}

function saveFormulario() {
    const formDiv = document.getElementById('inspectionForm');
    guardarInspeccion(formDiv);
}

function marcarTodoNo() {
    const radiosNo = document.querySelectorAll('input[type="radio"][value="No"]');
    radiosNo.forEach(radio => {
        radio.checked = true;
        const formDiv = document.getElementById('inspectionForm');
        guardarInspeccion(formDiv);
    });
}
/*******************************************************************/
/*                          Crear Firma                            */
/*******************************************************************/
const canvasInicial = document.getElementById('signatureCanvas');
const ctxInicial = canvasInicial.getContext('2d');
habilitarDibujo(canvasInicial, ctxInicial);

/*
// Obtener el canvas y contexto para dibujar
const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
let firma;

// Variables para el control de dibujo
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Iniciar el dibujo cuando el usuario comienza a presionar el ratón
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
});

// Detener el dibujo cuando el ratón se deja de presionar
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

// Permitir el dibujo mientras el ratón se mueve
canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    // Obtener las coordenadas del ratón en el canvas
    const currentX = e.offsetX;
    const currentY = e.offsetY;

    // Dibujar una línea desde las últimas coordenadas hasta las actuales
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.lineWidth = 2;  // Grosor de la línea
    ctx.strokeStyle = 'black';  // Color de la firma
    ctx.stroke();

    // Actualizar las últimas coordenadas
    lastX = currentX;
    lastY = currentY;
});

// Limpiar el canvas al hacer clic en el botón "Limpiar"
document.getElementById('clearButton').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Guardar la firma como imagen al hacer clic en el botón "Guardar Firma"
document.getElementById('saveButton').addEventListener('click', () => {
    // Obtener la imagen en formato base64
    const signatureImage = canvas.toDataURL("image/png");

    // Mostrar la imagen capturada
    const img = document.getElementById('signatureImage');
    img.src = signatureImage;
    firma = img.src;
    img.style.display = 'block';

    /*imgtoBlob(img.src)
    .then(({ blob, extension }) => {
        // Guardar la foto
        const fotoName = `foto-firma.${extension}`;
        guardarFotoEnIndexedDB("fotosFirma", blob, "INSPECCION", "01", fotoName);
        const formDiv = document.getElementById('inspectionForm');
        guardarInspeccion(formDiv);
        close_video();
    })
    .catch(err => {
        console.error("Error:", err.message);
    });
    /*img.style.display = 'block'; // Mostrar la imagen

    // Crear un enlace de descarga
    const link = document.createElement('a');
    link.href = signatureImage;
    link.download = 'firma.png'; // Nombre del archivo a guardar
    link.click(); // Descargar la imagen
});
*/

// Función para habilitar los eventos de dibujo en el canvas
function habilitarDibujo(canvas, ctx) {
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Iniciar el dibujo cuando el usuario comienza a presionar el ratón
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        lastX = e.offsetX;
        lastY = e.offsetY;
    });

    // Detener el dibujo cuando el ratón se deja de presionar
    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
        guardarFirma();
    });

    // Permitir el dibujo mientras el ratón se mueve
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;

        const currentX = e.offsetX;
        const currentY = e.offsetY;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(currentX, currentY);
        ctx.lineWidth = 2;  // Grosor de la línea
        ctx.strokeStyle = 'black';  // Color de la firma
        ctx.stroke();

        lastX = currentX;
        lastY = currentY;
    });

    // Limpiar el canvas si se desea
    document.getElementById('clearButton').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const img = document.getElementById('signatureImage');
        img.removeAttribute("src");
        const formDiv = document.getElementById('inspectionForm');
        guardarInspeccion(formDiv);
    });
}

function guardarFirma() {
    console.log("guardar firma")
    const canvas = document.getElementById('signatureCanvas');
    const signatureImage = canvas.toDataURL("image/png");

    // Mostrar la imagen capturada
    const img = document.getElementById('signatureImage');
    img.src = signatureImage;

    const formDiv = document.getElementById('inspectionForm');
    guardarInspeccion(formDiv);
}

// Función para guardar el canvas con fondo blanco
function guardarCanvasConFondoBlanco() {
    // Primero, dibujamos un fondo blanco en todo el canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);  // Rellenamos todo el canvas de blanco

    // Luego, recuperamos la imagen del canvas con fondo blanco
    const signatureImage = canvas.toDataURL("image/png");

    const img = document.getElementById('signatureImage');
    img.src = signatureImage;

    // Ahora puedes guardar la imagen como antes, por ejemplo en IndexedDB o descargarla
    return img;
}



/*******************************************************************/
/*                       Guardar Formulario                        */
/*******************************************************************/

document.getElementById("inspectionForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const form = e.target;
    const zip = new JSZip();
    const respuestas = [];

    const formData = new FormData(form);
    let placa = "sinplaca";
    let fechaSave = "sindate";

    const div = document.getElementById('fotos-formInspeccion');
    const imgElements = div.querySelectorAll('.preview');

    let imagenes = [];
    for (const img of imgElements) {
        if (img.src && img.src.trim() !== "") {
            imagenes.push(img.src);
        }
    }
    if (imagenes.length < 6) {
        let texto = 'Debes subir todas las fotos."';
        mostrarAlerta("Alerta", texto, "ACEPTAR", closeAlert)
        return;
    }

    const firma = document.getElementById('signatureImage');
    //const firma = guardarCanvasConFondoBlanco();
    if (firma.src && firma.src.trim() !== "") {
        imagenes.push(firma.src);
    } else {
        let texto = 'Debes agregar la firma."';
        mostrarAlerta("Alerta", texto, "ACEPTAR", closeAlert)
        return;
    }

    await agregarImagenesAlZipInspeccion(imagenes, name_btn, formInspeccion, zip);

    formData.forEach((value, key) => {
        if (value instanceof File && value.name) {
            zip.file(`fotos/${key}_${value.name}`, value);
        } else {
            respuestas.push(`${key}: ${value}`);
            if (key === "placa_vehiculo") placa = value.replace(/\s+/g, "_");
        }
    });

    zip.file("respuestas.txt", respuestas.join("\n"));
    const blob = await zip.generateAsync({ type: "blob" });
    const nombreArchivo = `inspeccion_${placa.toUpperCase()}_${fecha.value}.zip`;
    saveAs(blob, nombreArchivo);
    procesarBorradoInspeccion()
});

async function agregarImagenesAlZipInspeccion(imagenes, name_btn, nuevo, zip) {
    const promesas = imagenes.map((imgSrc, i) =>
        imgtoBlob(imgSrc)
            .then(({ blob, extension }) => {
                if (name_btn[nuevo][i] != undefined) {
                    zip.file(`fotos/foto-${name_btn[nuevo][i]}.${extension}`, blob);
                } else {
                    let empleado = document.querySelector("#encargado_nombre");
                    zip.file(`fotos/firma-${empleado.value}.${extension}`, blob);
                }

            })
            .catch(err => {
                console.error(`Error en imagen ${i}:`, err.message);
            })
    );

    await Promise.all(promesas);
    console.log("✅ Todas las imágenes fueron agregadas al ZIP");
}

async function procesarBorradoInspeccion() {
    try {
        const fotosInspeccionId = document.querySelector('.fotosInspeccion');
        const resultado = await eliminarPorFormId(fotosInspeccionId.id);
        console.log(resultado);
        fotosInspeccionId.remove();
        const formDiv = document.getElementById('inspectionForm');
        formDiv.reset();
        resetCanvas();
        resetFechaHora();
        crearFotosFormInspeccion();
        guardarInspeccion(formDiv);
    } catch (error) {
        mostrarAlerta("Error", `Error durante el borrado: ${error}`, "ACEPTAR", closeAlert);
    }
}

function resetCanvas() {
    const canvas = document.getElementById('signatureCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas
}

async function eliminarPorFormId(formId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = (event) => {
            reject(`Error al abrir la base de datos: ${event.target.error}`);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['registro'], 'readwrite');
            const store = transaction.objectStore('registro');

            let eliminados = 0;

            // Asegúrate de que el índice 'by_formId' exista
            console.log(formId)
            const index = store.index('by_formId');
            const range = IDBKeyRange.only(formId);
            const cursorRequest = index.openCursor(range);

            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    eliminados++;
                    cursor.continue();
                }
            };

            cursorRequest.onerror = (event) => {
                reject(`Error al recorrer los datos: ${event.target.error}`);
            };

            transaction.oncomplete = () => {
                db.close();
                resolve(`Se eliminaron ${eliminados} registros con formId = ${formId}`);
            };

            transaction.onerror = (event) => {
                reject(`Error en la transacción: ${event.target.error}`);
            };
        };
    });
}


crearFotosFormInspeccion();















/*******************************************************************/
/*                        Crear Alerta                             */
/*******************************************************************/

function asignarFuncionAlBoton(elemento, funcion) {
    elemento.addEventListener("click", funcion);
}

function mostrarAlerta(title, body, btn1, method1, btn2, method2) {
    var alert = document.createElement("sectionAlert");
    alert.innerHTML = `
    <section id="sectionAlert" class="visible">
        <div class="alert">
            <h3 id="titleAlert">${title}</h3>
            <div id="bodyAlert">${body}</div>
            <div class="errorAlert"></div>
            <div id="footAlert">
                <button id="btnAlert1" type="button"></button>
                <button id="btnAlert2" type="button"></button>
            </div>
        </div>
    </section>`;
    document.body.appendChild(alert);

    let btnAlert1 = document.querySelector("#btnAlert1");
    let btnAlert2 = document.querySelector("#btnAlert2");
    if (btn1 != "") {
        btnAlert1.innerHTML = btn1;
        btnAlert1.focus()
        asignarFuncionAlBoton(btnAlert1, method1);
    }
    if (btn2 !== undefined) {
        btnAlert2.innerHTML = btn2;
        asignarFuncionAlBoton(btnAlert2, method2);
        btnAlert2.classList.add("visible");
    }
}

function closeAlert() {
    var alert = document.querySelector("sectionAlert");
    document.body.removeChild(alert);
}

/*******************************************************************/
/*                     Crear Notificación                          */
/*******************************************************************/

function activeNotify(text, time = 2000) {
    // Crear el contenedor si no existe
    let container = document.getElementById('notify-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notify-container';
        document.body.appendChild(container);
    }

    // Generar ID único
    var caracteres = "abcdefghijklmnopqrstuvwxyz0123456789";
    var codigo = "";
    for (var i = 0; i < 3; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    var notifyID = "notify_".concat(codigo);

    // Crear la notificación
    var notify = document.createElement('div');
    notify.id = notifyID;
    notify.classList.add("notify");
    notify.innerHTML = text;
    container.appendChild(notify);

    // Remover después del tiempo
    setTimeout(function () {
        notify.classList.add('notify-exit');
        setTimeout(() => {
            container.removeChild(notify);
            // Eliminar el contenedor si está vacío
            if (container.children.length === 0) {
                document.body.removeChild(container);
            }
        }, 500); // tiempo para que termine la animación de salida
    }, time);
}







/*
function agregarEntrada() {
    const formId = generarUUID();
    const formDiv = document.getElementById('formulario');
    const div = document.createElement('div');
    div.className = 'formPlaca';
    div.id = `formPlaca-${formId}`;
    div.innerHTML = `
                <div class="section_entrada"><label class="lb_placa"><span>Placa</span><input type="text" name="placa" oninput="actualizarFiltro()"></label>
                <button class="btn_entrada" onclick="createElements(${name_btn[container_1].length}, 'formPlaca-${formId}', '${container_1}', '${container_2}')">🚚 ${container_1}</button>
                <button class="btn_entrada" onclick="createElements(${name_btn[container_2].length}, 'formPlaca-${formId}', '${container_2}', '${container_1}')">🚚 ${container_2}</button></div>
            `;
    formDiv.appendChild(div);
    contador++;
    guardarBody(formDiv);
}

async function guardarBody(formDiv) {
    const request = indexedDB.open(dbName, dbVersion);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');

        // Guardar el formulario
        const getRequest = store.get(1); 
        getRequest.onsuccess = function () {
            const formularioObject = {
                id: 1,
                history: formDiv.outerHTML
            };
            const formularioRequest = store.put(formularioObject);
            formularioRequest.onsuccess = function () {
                console.log('Formulario guardado con éxito');
            };
        };
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Aquí va la función que deseas ejecutar
    console.log('La página ha cargado y el DOM está listo.');
    recuperarBody();
});

function recuperarBody() {
    const request = indexedDB.open(dbName, dbVersion);
    const formDiv = document.getElementById('formulario');
  
    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      
      const requestGet = store.get(1);  
      requestGet.onsuccess = function(event) {
        const bodyObject = event.target.result;
        if (bodyObject) {      
          formDiv.innerHTML = bodyObject.history;
        } else {
          console.log('Body no encontrado');
        }
      };
    };
  }


function createElements(cant, element, nuevo, old) {
    let id = element.split('-')[1];
    const formPlaca = document.getElementById(element);
    const placa = formPlaca.querySelector('input[type="text"]').value.trim();
    placa.innerHTML = placa;
    const regex = /^[A-Za-z]{3}\d{3}$/;
    if (placa == "") {
        alert('Por favor, ingresa la placa.');
        return;
    } else if (!regex.test(placa)) {
        alert('El formato de la placa es incorrecto. Debe ser 3 letras seguidas de 3 números.');
        return;
    } else {
        const sectionNew = document.getElementById(`${id}${nuevo}`);
        const sectionOld = document.getElementById(`${id}${old}`);
        if (formPlaca.contains(sectionOld)) {
            formPlaca.removeChild(sectionOld);
        }
        if (!formPlaca.contains(sectionNew)) {
            const div = document.createElement('div');
            div.id = `${id}${nuevo}`;
            div.classList.add("section_preview");
            div.innerHTML += `
                        ${[...Array(cant)].map((_, i) => `<div class="section_foto"><img id="preview-${id}${i}" class="preview">
                        <button id="btn_camera-${id}${i}" class="btn_camera" onclick="startCamera('${id}${i}')">📷 ${name_btn[nuevo][i]}</button></div>`).join('')}
                        <div class="section_btns"><button class="btn_guardar" onclick="guardar('${id}', '${nuevo}')">💾 Guardar</button>
                        <button class="btn_eliminar" onclick="eliminar('${id}')">X</button></div>
                    `;
            formPlaca.appendChild(div);
        }
    }
    const formDiv = document.getElementById('formulario');
    guardarBody(formDiv);
}


function startCamera(id) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            let btn_foto = document.querySelector("#btn_foto");
            currentStream = stream;
            video.classList.add("active");
            camera.srcObject = stream;
            btn_foto.setAttribute("dataId", id);
        })
        .catch(error => {
            alert("Error accediendo a la cámara: " + error.message);
        });
}


function close_video() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        document.getElementById("camera").srcObject = null;
    }
    video.classList.remove("active");
}

/*function capture(stage) {
    let id = stage.getAttribute("dataId");
    const video = document.getElementById("camera");
    const canvas = document.getElementById("snapshot");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const data = canvas.toDataURL('image/jpeg');
    close_video();
    const preview = document.getElementById(`preview-${id}`);
    preview.src = data;
    preview.classList.add("active");
    const btn_camera = document.getElementById(`btn_camera-${id}`);
    btn_camera.style.background = "#00787a";

    /*const enlace = document.createElement('a');
    enlace.href = preview.src;
    enlace.download = 'imagen-descargada.jpg'; // Nombre del archivo al guardar
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    guardarFotoEnIndexedDB(formId, fotoBlob, placa, fotoIndex);
}

async function capture(stage) {
    let id = stage.getAttribute("dataId");
    let newStr = id.slice(0, -1);
    let pos = id.slice(-1);
    const formPlaca = document.getElementById(`formPlaca-${newStr}`);
    const placa = formPlaca.querySelector('input[type="text"]').value.trim();
    console.log(placa)
    const container = formPlaca.querySelector('.section_preview').id.slice(-4);
    const video = document.getElementById("camera");
    const canvas = document.getElementById("snapshot");

    // Establece el tamaño del canvas igual al del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibuja el contenido del video en el canvas
    canvas.getContext('2d').drawImage(video, 0, 0);

    // Convierte el contenido del canvas en un Data URL (en base64)
    const dataURL = canvas.toDataURL('image/jpeg');

    // Muestra la imagen
    const preview = document.getElementById(`preview-${id}`);
    preview.src = dataURL;
    preview.classList.add("active");

    // Actualiza el estilo del botón de la cámara
    const btn_camera = document.getElementById(`btn_camera-${id}`);
    btn_camera.style.background = "#00787a";

    // Convierte la imagen en un Blob
    const blob = imgtoBlob(preview.src);
    const fotoId = id;
    const fotoName = `foto-${name_btn[container][pos]}.${blob.extension}`;

    // GUardar la foto
    guardarFotoEnIndexedDB(formPlaca.id, blob, placa.toUpperCase(), fotoId, fotoName);
    const formDiv = document.getElementById('formulario');
    guardarBody(formDiv);
    close_video();
}

function imgtoBlob(imgSrc) {
    let byteArray;
    let extension;
    if (imgSrc.startsWith('data:image/')) {
        // Extraer tipo de imagen (jpeg, png, etc.)
        const mimeMatch = imgSrc.match(/^data:image\/(\w+);base64,/);
        extension = mimeMatch ? mimeMatch[1] : 'jpg';

        // Extraer el contenido base64 (sin el encabezado data:image/...)
        const base64Data = imgSrc.replace(/^data:image\/\w+;base64,/, '');

        // Convertir base64 a binario (Uint8Array)
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        byteArray = new Uint8Array(byteNumbers);
    }
    return {
        blob: new Blob([byteArray], { type: 'image/jpeg' }),
        extension: extension
    }
}

function guardarFotoEnIndexedDB(formId, fotoBlob, placa, fotoId, fotoName) {
    const request = indexedDB.open(dbName, dbVersion);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['registro'], 'readwrite');
        const store = transaction.objectStore('registro');

        const fotoObject = {
            formId: formId,
            placa: placa,
            fotoId: fotoId,
            fotoName: fotoName,
            blob: fotoBlob,
            timestamp: new Date(),
        };

        /*const fotoRequest = store.put(fotoObject); // Guardamos la foto con su formulario
        fotoRequest.onsuccess = function () {
            console.log(`Foto ${fotoIndex} guardada con éxito en IndexedDB`);
        };
        // Verificamos si la foto ya existe antes de guardarla
        const getRequest = store.get(fotoName);  // Usamos `fotoIndex` como clave primaria o un identificador único
        console.log(getRequest)
        getRequest.onsuccess = function () {
            if (getRequest.result) {
                // Si ya existe, sobreescribimos la foto
                console.log(`Foto ${fotoName} ya existe, se sobrescribirá`);
                const fotoRequest = store.put(fotoObject);
                fotoRequest.onsuccess = function () {
                    console.log(`Foto ${fotoName} sobrescrita con éxito en IndexedDB`);
                };
            } else {
                // Si no existe, la guardamos como nueva
                const fotoRequest = store.add(fotoObject);  // Usamos `add` para asegurar que solo agregamos si no existe
                fotoRequest.onsuccess = function () {
                    console.log(`Foto ${fotoName} guardada con éxito en IndexedDB`);
                };
            }
        };

        getRequest.onerror = function () {
            console.error("Error al verificar si la foto existe en IndexedDB");
        };
    };
}

async function guardar(id, nuevo) {
    const div = document.getElementById(`placa-${id}`);
    const placa = div.querySelector('input[type="text"]').value.trim();
    const imgElements = div.querySelectorAll('img');
    const regex = /^[A-Za-z]{3}\d{3}$/;
    if (!placa) {
        alert('Por favor, ingresa la placa.');
        return;
    }

    if (!regex.test(placa)) {
        alert('El formato de la placa es incorrecto. Debe ser 3 letras seguidas de 3 números.');
        return;
    }

    let imagenes = [];
    for (const img of imgElements) {
        if (img.src && img.src.trim() !== "") {
            imagenes.push(img.src);
        }
    }
    if (imagenes.length < 6) {
        alert('Debes subir al menos 6 fotos. "Precinto", "Tablero", "Ficho", "Hoja1", "Hoja2", "100%"');
        return;
    }

    const zip = new JSZip();
    for (let i = 0; i < imagenes.length; i++) {
        const imgSrc = imagenes[i];

        if (imgSrc.startsWith('data:image/')) {
            // Extraer tipo de imagen (jpeg, png, etc.)
            const mimeMatch = imgSrc.match(/^data:image\/(\w+);base64,/);
            const extension = mimeMatch ? mimeMatch[1] : 'jpg';

            // Extraer el contenido base64 (sin el encabezado data:image/...)
            const base64Data = imgSrc.replace(/^data:image\/\w+;base64,/, '');

            // Convertir base64 a binario (Uint8Array)
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let j = 0; j < byteCharacters.length; j++) {
                byteNumbers[j] = byteCharacters.charCodeAt(j);
            }
            const byteArray = new Uint8Array(byteNumbers);
            return new Blob([byteArray], { type: 'image/jpeg' });
            // Agregar al ZIP
            zip.file(`foto-${name_btn[nuevo][i]}.${extension}`, byteArray);
        }
    }

    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            if (confirm(`¿ Quiere descargar como .ZIP las fotos de la placa ${placa.toUpperCase()} ?`)) {
                saveAs(content, `placa-${placa.toUpperCase()}.zip`);
                div.remove();
            }
            const filtro = document.getElementById('buscador');
            filtro.value = "";
            actualizarFiltro();
        });
}

function eliminar(id) {
    const div = document.getElementById(`placa-${id}`);
    const placa = div.querySelector('input[type="text"]').value.trim();
    if (placa != "") {
        if (confirm(`¿ Deseas eliminar el registro de la placa ${placa.toUpperCase()} ?`)) {
            div.remove();
        }
    } else {
        div.remove();
    }
}

function filtrarPlacas() {
    const filtro = document.getElementById('buscador').value.toLowerCase();
    const entradas = document.querySelectorAll('.formPlaca');

    entradas.forEach(entry => {
        const placaInput = entry.querySelector('input[type="text"]');
        const placaValor = placaInput.value.toLowerCase();
        entry.style.display = placaValor.includes(filtro) ? '' : 'none';
    });
}

function actualizarFiltro() {
    filtrarPlacas();
}
    */



/*******************************************************************/
/*                       Manejo de Sesión                          */
/*******************************************************************/

// Cerrar sesión
function logout() {
    sessionStorage.removeItem('loggedIn');
    //console.log("Usuario desconectado");
}

// Detecta si el usuario está navegando hacia atrás
window.addEventListener('popstate', function (event) {
    //console.log("El usuario ha pulsado el botón Atrás");
    history.pushState(null, null, window.location.href);
    logout();
});

// Validar estado de la sesión
function checkSession() {
    let isLoggedIn = sessionStorage.getItem('loggedIn');
    if (!isLoggedIn) {
        //console.log("No hay sesión activa");
        window.location.href = "login.html";
    }
}

checkSession()