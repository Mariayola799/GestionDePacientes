const fs = require("fs");

class Paciente {
    nombre;
    apellido;
    ci;
    direccion;
    sintomas;
    fecha;
    constructor(nombre, apellido, ci, direccion, sintomas, fecha) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.ci = ci;
        this.direccion = direccion;
        this.sintomas = sintomas;
        this.fecha = fecha;
    }
    modificar(nombre, apellido, direccion, sintomas, fecha) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.direccion = direccion;
        this.sintomas = sintomas;
        if (fecha !== undefined && fecha !== null && fecha !== '') {
            this.fecha = fecha;
        }
    }
    informacion() {
        console.log("-------------------------------");
        console.log("-----Datos del paciente--------");
        console.log("-------------------------------\n");
        return `Nombre: ${this.nombre} ${this.apellido}
        \nCédula de Identidad: ${this.ci}
        \nSíntomas: ${this.sintomas}
        \nDirección: ${this.direccion}
        \nFecha: ${this.fecha}\n\n-------------------------------\n`;
    }
}

class Persona {
    #Lista = [];
    #JsonName = "";

    constructor(JsonName) {
        this.#JsonName = JsonName;
        if (fs.existsSync(JsonName)) {
            try {
                const dataBase = fs.readFileSync(JsonName, "utf8");
                const parsed = JSON.parse(dataBase);
                const data = parsed.pacienteData || [];
                this.#Lista = data.map(a => new Paciente(a.nombre, a.apellido, a.ci, a.direccion, a.sintomas, a.fecha));
            } catch (err) {
                console.error("Error al leer la base de datos:", err);
                this.#Lista = [];
            }
        } else {
            const dataBase = JSON.stringify({
                pacienteData: []
            }, null, 2);
            fs.writeFileSync(JsonName, dataBase);
        }
    }

    registrarPaciente(nombre, apellido, ci, direccion, sintomas, fecha) {
        const nuevoPaciente = new Paciente(nombre, apellido, ci, direccion, sintomas, fecha);
        this.#Lista.push(nuevoPaciente);
        this.guardar();
        return nuevoPaciente;
    }
    modificarPaciente(ci, nombre, apellido, direccion, sintomas, fecha) {
        let paciente = this.buscarPaciente(ci);
        if (paciente) {
            paciente.modificar(nombre, apellido, direccion, sintomas, fecha);
            this.guardar();
            return paciente;
        }
        return null;
    }
    existePaciente(ci) {
        return this.#Lista.some(paciente => String(paciente.ci).trim().toLowerCase() === String(ci).trim().toLowerCase());
    }
    buscarPaciente(ci) {
        return this.#Lista.find(paciente => String(paciente.ci).trim().toLowerCase() === String(ci).trim().toLowerCase());
    }
    todosPaciente() {
        return this.#Lista;
    }
    eliminarPaciente(ci) {
        let i = this.#Lista.findIndex(paciente => String(paciente.ci).trim().toLowerCase() === String(ci).trim().toLowerCase());
        if (i !== -1) {
            const eliminado = this.#Lista.splice(i, 1);
            this.guardar();
            return eliminado[0];
        }
        return null;
    }
    guardar() {
        const dataBase = JSON.stringify({
            pacienteData: this.#Lista
        }, null, 2);
        fs.writeFileSync(this.#JsonName, dataBase);
    }
}

module.exports.Paciente = Paciente;
module.exports.Persona = Persona;

