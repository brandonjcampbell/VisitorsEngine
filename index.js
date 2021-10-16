// Import the Express module
import express from 'express';

// Import the 'path' module (packaged with Node.js)
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import socketio from 'socket.io'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Create a new instance of Express
var app = express();

// Import the Anagrammatix game file.
import agx from './agxgame.js';

// Create a simple Express application
app.configure(function() {
    // Turn down the logging activity
    app.use(express.logger('dev'));

    // Serve static html, js, css, and image files from the 'public' directory
    app.use(express.static(path.join(__dirname,'public')));
});

// Create a Node.js based http server on port 8080
var server = http.createServer(app).listen(process.env.PORT || 8080);

// Create a Socket.IO server and attach it to the http server
var io = socketio.listen(server);

// Reduce the logging output of Socket.IO
io.set('log level',1);

// Listen for Socket.IO Connections. Once connected, start the game logic.
io.sockets.on('connection', function (socket) {
    //console.log('client connected');
    agx.initGame(io, socket);
});


