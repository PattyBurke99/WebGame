// TO DO NEXT: IMPLEMENT CONNECTION MESSAGES, SEND DATA ABOUT OTHER PLAYERS TO EVERYONE
// EVERY PLAYER KNOWS THEIR OWN NETWORK ID, WE COULD POPULATE A LOCAL ARRAY USING A NEW
// MESSAGE TYPE THEN CREATE SERVERSIDE PROCESS THAT PERIODICALLY SENDS OUT ALL PLAYER
// LOCATIONS 

const WebSocket = require('ws');
const server = new WebSocket.Server({
  port: 8080,
});

const max_players = 3;

//NETWORK OBJECTS HERE
function player_data_object(id) {
  this.id = id;
  //These values set after client returns handshake
  this.name;
  this.x;
  this.y;
}

//Handshake message, sent to player to tell them their netID
//Sometime in future use random key for verification
function HsMessage(id) {
  this.type = "hs";
  this.id = id;
}

console.log("Server started");
let players = [];

server.on('connection', function(socket) {
  let player_index;

  console.log(`Client connecting...`);

  //Place new player in lowest undefined index in array
  for (let i=0; i < max_players; i++) {
    if (typeof(players[i]) == 'undefined') {
      players[i] = new player_data_object(i);
      player_index = i;
      break;
    } 
  }

    //Occurs when max players is reached
  if (typeof player_index == 'undefined') {
    console.log("Refusing connection. Max players reached.");
    socket.terminate();
    return;
  }

  //Send handshake message to client, this tells client their player_index, they
  //will reply with their name, x, and y which will be added to the player_data_object
  const hsMessage = new HsMessage(player_index);
  socket.send(JSON.stringify(hsMessage));

  console.log(`Player connected with ID ${player_index}`);

  //Attach new message listener to connected socket
  socket.on('message', function(event) {
    const msg = JSON.parse(event);
    if (msg.type == "hs") {
      if (msg.id != player_index) {
        console.log(`Mismatched ids on handshake! disconnecting player ${player_index}`);
        socket.terminate();
        return;
      }

      players[player_index].name = msg.name;
      players[player_index].x = msg.x;
      players[player_index].y = msg.y;
      console.log(`HS Reply received from player id:${player_index}, player_name: ${players[player_index].name}, x:${msg.x}, y: ${msg.y}`);
    }
    else if (msg.type == "status") {
      if (msg.id != player_index) {
        console.log(`Mismatched ids received from player id ${player_index}! Closing connection.`);
        socket.terminate();
        return;
      }

      console.log(`STATUS: ${players[player_index].name} id: ${msg.id} X: ${msg.x} Y: ${msg.y}`);
      players[player_index].x = msg.x;
      players[player_index].y = msg.y;
    }
  });

  // Attach onclose listener to connected socket
  socket.on('close', function() {
    players[player_index] = undefined;
    console.log(`Client ${player_index} Disconnected!`);
  });
});