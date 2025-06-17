let camera = document.querySelector("#camera");
let video = document.querySelector("#video");

let currentStream;
let contador = 0;
let name_btn = {
    "30T": ["Precinto", "Tablero", "100%", "75%", "50%", "25%", "0%"],
    "40T": ["Precinto", "Tablero", "100%", "75%", "50%", "25%", "0%"]
};

function agregarEntrada() {
    const formDiv = document.getElementById('formulario');
    const div = document.createElement('div');
    div.className = 'placa-entry';
    div.id = `placa-${contador}`;
    div.innerHTML = `
                <div class="section_entrada"><label class="lb_placa"><span>Placa</span><input type="text" name="placa" required oninput="actualizarFiltro()"></label>
                <button class="btn_entrada" onclick="createElements(3, 'placa-${contador}', '30T', '40T')">🚚 30T</button>
                <button class="btn_entrada" onclick="createElements(4, 'placa-${contador}', '40T', '30T')">🚚 40T</button></div>
            `;
    formDiv.appendChild(div);
    contador++;
}

function createElements(cant, element, nuevo, old) {
    let contador = element.split('-')[1];
    const placaDiv = document.getElementById(element);
    const sectionNew = document.getElementById(`${contador}${nuevo}`);
    const sectionOld = document.getElementById(`${contador}${old}`);
    if (placaDiv.contains(sectionOld)) {
        placaDiv.removeChild(sectionOld);
    }
    if (!placaDiv.contains(sectionNew)) {
        const div = document.createElement('div');
        div.id = `${contador}${nuevo}`;
        div.innerHTML += `
                    ${[...Array(cant)].map((_, i) => `<div class="section_foto"><img id="preview-${contador}${i}" class="preview">
                    <button id="btn_camera-${contador}${i}" class="btn_camera" onclick="startCamera('${contador}${i}')">📷 ${name_btn[nuevo][i]}</button></div>`).join('<br>')}
                    <div class="section_btns"><button class="btn_guardar" onclick="guardar('${contador}')">💾 Guardar</button>
                    <button class="btn_eliminar" onclick="eliminar('${contador}')">X</button></div>
                `;
        placaDiv.appendChild(div);
    }
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

function capture(stage) {
    let id = stage.getAttribute("dataId");
    console.log(id);
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
}

async function guardar(id) {
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
    if (imagenes.length === 0) {
        alert('Debes subir al menos 3 fotos.');
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

            // Agregar al ZIP
            zip.file(`foto-${name_btn[i]}.${extension}`, byteArray);
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
    const entradas = document.querySelectorAll('.placa-entry');

    entradas.forEach(entry => {
        const placaInput = entry.querySelector('input[type="text"]');
        const placaValor = placaInput.value.toLowerCase();
        entry.style.display = placaValor.includes(filtro) ? '' : 'none';
    });
}

function actualizarFiltro() {
    filtrarPlacas();
}
