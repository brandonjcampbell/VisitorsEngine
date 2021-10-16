import _ from "lodash";
import engine from "./public/gameplay/engine.js"
var io;
var gameSocket;

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */

console.log(engine)

const initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Host Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostPlayerActionsQueued', hostPlayerActionsQueued);
    gameSocket.on('hostCountdownFinished', hostStartGame);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerAction', playerAction);
    gameSocket.on('playerRestart', playerRestart);
}


/* *******************************
   *                             *
   *       HOST FUNCTIONS        *
   *                             *
   ******************************* */

/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */
function hostCreateNewGame() {
    // Create a unique Socket.IO Room
    var thisGameId = ( Math.random() * 100000 ) | 0;

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id, gameState:_.cloneDeep(engine.gameState)});

    // Join the Room and wait for the players
    this.join(thisGameId.toString());
};

/*
 * Two players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */
function hostPrepareGame(gameId,gameState) {
    var sock = this;
    var data = {
        mySocketId : sock.id,
        gameId : gameId,
        gameState:gameState
    };
    //console.log("All Players Present. Preparing game...");
    io.sockets.in(data.gameId).emit('beginNewGame', data);
}

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(gameId,gameState) {
    console.log('Game Started.');
    //sendWord(0,gameId);
    sendGameState(gameId,gameState)
};

/**
 * A player answered correctly. Time for the next word.
 * @param data Sent from the client. Contains the current round and gameId (room)
 */

 function hostPlayerActionsQueued(gameId,gameState,queue) {
    console.log("BOTH ACTIONS QUEUED!")
    const newState = engine.executeRound(gameState,queue)
    const newerState = engine.nextRound(newState)
    console.log(newerState)
    if(newerState.gameOver===true){
        io.sockets.in(gameId).emit('gameOver',newerState);
    }else{
        io.sockets.in(gameId).emit('newGameState', newerState);
    }
}


/* *****************************
   *                           *
   *     PLAYER FUNCTIONS      *
   *                           *
   ***************************** */

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
function playerJoinGame(data) {
    //console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );

    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = gameSocket.manager.rooms["/" + data.gameId];

    // If the room exists...
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = sock.id;

        // Join the room
        sock.join(data.gameId);

        //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error',{message: "This room does not exist."} );
    }
}


function playerAction(data,gameState) {
    console.log("a player's actions queued!")
    io.sockets.in(data.gameId).emit('hostQueueAction', data, gameState);
}

function playerRestart(data) {
    data.playerId = this.id;
    io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
}

/* *************************
   *                       *
   *      GAME LOGIC       *
   *                       *
   ************************* */



function sendGameState(gameId,gameState) {
        let newGameState = _.cloneDeep(gameState)
        console.log(gameState)
     io.sockets.in(gameId).emit('newGameState', engine.nextRound(gameState));
 }

let axg= {
    initGame
}
export default axg