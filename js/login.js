// Datos usuario registrado
const username = "admin";
let hashedPassword = "$2b$10$fM07G2oGTRXYsjthqGaD/elu7AsMbQKjB1WHDxCaxT.OOBFrBkn2q";

/* Generar el hash de la contraseña
const plainPassword = "";
bcrypt.hash(plainPassword, 10, function(err, hash) {
    if (err) {
        console.error("Error generando el hash de la contraseña:", err);
        return;
    }
    hashedPassword = hash;
    console.log(hashedPassword)
});
*/

// Iniciar sesión
document.getElementById("login").addEventListener("submit", function (e) {
    e.preventDefault();
    const inputUsername = document.getElementById("username").value;
    const inputPassword = document.getElementById("password").value;

    if (inputUsername === username) {
        // Comparar el hash de la contraseña ingresada con el almacenado
        bcrypt.compare(inputPassword, hashedPassword, function (err, result) {
            if (result) {
                sessionStorage.setItem("loggedIn", "true");  // Guardar sesión
                window.location.href = "index.html";
            } else {
                document.getElementById("errorMessage").style.display = "block";
                setTimeout(() =>{
                    document.getElementById("errorMessage").style.display = "none";
                },1000);
            }
        });
    } else {
        document.getElementById("errorMessage").style.display = "block";
        setTimeout(() =>{
            document.getElementById("errorMessage").style.display = "none";
        },1000);
    }
});

/*******************************************************************/
/*                       Manejo de Sesión                          */
/*******************************************************************/

// Validar estado de la sesión
function checkSession() {
    let isLoggedIn = sessionStorage.getItem('loggedIn');
    if (isLoggedIn) {
        //console.log("Sesión activa");
        logout();
    } 
}

// Detecta si el usuario está navegando hacia atrás
window.addEventListener('popstate', function(event) {
    //console.log("El usuario ha pulsado el botón Atrás");
    logout();
    history.pushState(null, null, window.location.href);
});

// Cerrar la sesión
function logout() {
    sessionStorage.removeItem('loggedIn');
    //console.log("Usuario desconectado");
}

checkSession()
