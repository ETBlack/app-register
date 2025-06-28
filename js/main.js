let camera = document.querySelector("#camera");
let video = document.querySelector("#video");

let currentStream;
let contador = 0;
let container_1 = "20FT";
let container_2 = "40FT";
let name_btn = {
    [container_1]: ["Precinto", "Tablero", "Ficho", "Hoja1", "Hoja2", "100%", "50%", "0%"],
    [container_2]: ["Precinto", "Tablero", "Ficho", "Hoja1", "Hoja2", "100%", "75%", "50%", "25%", "0%"]
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
    }
};

request.onerror = function (event) {
    console.error('Error al abrir la base de datos', event.target.error);
};

request.onsuccess = function (event) {
    const db = event.target.result;
    console.log('Base de datos abierta con éxito');
};


// Función para generar UUID
function generarUUID() {
    return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


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
}*/

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
        };*/
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



/*******************************************************************/
/*                       Manejo de Sesión                          */
/*******************************************************************/

// Cerrar sesión
function logout() {
    sessionStorage.removeItem('loggedIn');
    //console.log("Usuario desconectado");
}

// Detecta si el usuario está navegando hacia atrás
window.addEventListener('popstate', function(event) {
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