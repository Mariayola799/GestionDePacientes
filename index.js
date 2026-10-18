const prompt = require("prompt-sync")();
const readline = require('readline-sync');
const {Persona} = require("./pacientes.js")
let dataBase = new Persona("dataBase.json");
let opcion = 0;function esperar(ms) {
    const inicio = Date.now();
    while (Date.now() - inicio < ms) {
    }
}
do {
    console.clear();
    console.log(" ---------------------------------------------\n| Sitema de gestión de pacientes ASIC Miranda |\n ---------------------------------------------")
    console.log("1. Registar paciente")
    console.log("2. Buscar paciente")
    console.log("3. Ver todos los pacientes")
    console.log("4. Borrar Paciente")
    console.log("5. Editar Paciente")
    console.log("6. salir")
    opcion = prompt("Ingrese su opción: ")
    let ci;
    
    switch (opcion) {
        case '1':
            console.clear();
            console.log("--------------------------");
            console.log("  registro de paciente");
            console.log("--------------------------");
            let nombre = prompt("Ingrese el nombre: ")
            let apellido = prompt("Ingrese el apellido: ");
            let cedula = prompt("Ingrese cedula: ")
            let direccion = prompt("Ingrese ciudad y dirección del paciente: ")
            let sintomas = prompt("Ingrese sintomas del paciente: ")
            let fecha = prompt("Ingrese Fecha Día/Mes/Año Del Ingreso Del Paciente: ")
            if (dataBase.existePaciente(ci)) {
                readline.question("El paciente ya fue registrado en esá fecha (Presione Enter para salir)", { hideEchoBack: true});
                break;
            }
            dataBase.registrarPaciente(nombre, apellido, cedula, direccion, sintomas, fecha);
            readline.question("Paciente registrado con exito (Presione Enter para salir)", { hideEchoBack: true});
            break;
        case '2':
            console.clear();
            console.log("-------------------------");
            console.log("     Buscar paciente     ");
            console.log("-------------------------");
            ci = prompt("Ingrese la cedula del paciente: ")
            if (!dataBase.existePaciente(ci)) {
                readline.question("la cedula ingresada no coincide con ningún paciente (Presione Enter para regresar)", { hideEchoBack: true});
                break;
            }
            const paciente = dataBase.buscarPaciente(ci);
            console.log(paciente.informacion());
            readline.question("Presione Enter para regresar", { hideEchoBack: true});
            break;
        case '3':
            console.clear();
            console.log("-------------------------");
            console.log("   Todos los pacientes");
            console.log("-------------------------");
            let aciente = dataBase.todosPaciente();
            for (let paciente of aciente) {
                console.log(paciente.informacion());
            }
            readline.question("Presione Enter para regresar...")
            break;
        case '4':
            console.clear();
            console.log("-------------------------");
            console.log("    Eliminar Paciente");
            console.log("-------------------------");
            ci = prompt("Ingrese la cédula del paciente: ")
            if (!dataBase.existePaciente(ci)) {
                console.clear();
                readline.question("--------------------------------------------\n| No existe ningún paciente con ésa cédula |\n--------------------------------------------\n\n(Presiona Enter para regresar)");
                break;
            }
            console.clear()
            let busqueda = dataBase.buscarPaciente(ci)
            console.log(busqueda.informacion());
            console.log("¿Seguro que desea eliminar al paciente?")
            let eliminar = prompt("Escriba 'y' para confirmar o 'n' para cancelar: ");
            if (eliminar == "y" || eliminar == "Y") {
                dataBase.eliminarPaciente(ci)
                console.log("Listo! ")
            } else if (eliminar == "n" || eliminar == "N") {
                readline.question("\n--------------------------------------------\n| Se canceló la operación de eliminación |\n--------------------------------------------\nPresiona Enter Para Regresar");
                break;
            }
            readline.question("Presiona Enter Para Regresar");
            break;
        case '5':
            console.clear()
            console.log("----------------------------")
            console.log("Modificar Paciente Ingresado")
            console.log("----------------------------")
            ci = prompt("Ingrese la cedula: ")
            if(!dataBase.existePaciente(ci)){
                console.clear()
                readline.question("\n------------------------------\n| No existe nungún paciente con ésa cédula |\n------------------------------\n\nPresione Enter Para Regresar")
                break;
            }
            let nombreNuevo = prompt("Ingrese nuevo nombre: ")
            let apellidoNuevo= prompt("Ingrese apellido nuevo: ")
            let direccionNuevo= prompt("Ingrese direccion nuevo: ")
            let sintomasNuevo= prompt("Ingrese sintoma nuevo: ")
            dataBase.modificarPaciente(ci,nombreNuevo,apellidoNuevo,direccionNuevo,sintomasNuevo)
            console.clear()
            readline.question("\n------------------------------\n| El paciente a sido modificado con exito |\n------------------------------\n\nPresione Enter Para Regresar")
            break;
        case '6':
            process.stdout.write("Cerrando sistema");
            for(let i = 0; i < 3; i++) {
                esperar(600); // Espera medio segundo
                process.stdout.write("."); // Agrega un punto sin saltar de línea
            }
            esperar(500);
            break;
        default:
            console.clear()
            console.log("-----------------\n|   ! ERROR !   |\n-----------------\n\nOpción que ingresaste es inválida\n")
            readline.question("Presione Enter para regresar");
        }
        console.clear()
    }while (opcion != 6)
dataBase.guardar()
