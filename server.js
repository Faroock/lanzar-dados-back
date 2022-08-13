//Servidor con express
const express = require("express");
const http = require("http");
const app = express();
const servidor = http.createServer(app);


//Inicializamos socketio
const socketio = require("socket.io");
const io = socketio(servidor, {
    cors: true,
    origins: ["http://localhost:3000"],
});

const jugadores = [];

const actualizarJugador = (jugador) => {
    const index = jugadores.findIndex((j) => j.id === jugador.id);
    if (index !== -1) {
        jugadores[index] = jugador;
    } else {
        jugadores.push(jugador);
    }
}

const lanzarDados = ({cantidad, caras, hambre, dificultad}) => {
    let resultado = [];
    let resultadoHambre = [];
    for (let i = 1; i <= hambre; i++) {
        resultadoHambre.push(Math.floor(Math.random() * caras) + 1);
    }
    for (let i = hambre + 1; i <= cantidad; i++) {
        resultado.push(Math.floor(Math.random() * caras) + 1);
    }
    return {resultado, hambre: resultadoHambre, dificultad};
}

io.on("connection", (socket) => {
    socket.on('conectado', (jugador) => {
        const { idCronica, nickname, id } = jugador
        socket.data = { idCronica, nickname, idJugador: id }
        console.log(`El jugador ${nickname} se ha conectado a la cronica ${idCronica}`)
        socket.join(idCronica)
        actualizarJugador(jugador)
        io.to(idCronica).emit('newPlayer', jugadores)
        console.log({data: socket.data})
    });

    socket.on('dados', (dados) => {
        const { idCronica, idJugador } = socket.data
        io.to(idCronica).emit('lanzando', {idJugador, lanzando: true, dados})
        console.log(dados)
        const { resultado, hambre, dificultad } = lanzarDados(dados)
        const espera = 1000 + Math.floor(Math.random() * 2000)
        setTimeout(() => {
            console.log({espera, resultado, hambre, dificultad})
            io.to(idCronica).emit('lanzando', {idJugador, lanzando: false})
            io.to(idCronica).emit('dados', {resultado, hambre, dificultad, idJugador})
        }, espera)
    });

    socket.on('disconnect', () => {
        const { idCronica, nickname } = socket.data
        console.log(`El jugador ${nickname} se ha desconectado de la cronica ${idCronica}`)
    });

});

servidor.listen(5000, () => {
    console.log("Servidor inicializado")
});