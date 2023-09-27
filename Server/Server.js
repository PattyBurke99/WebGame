const WebSocket = require('ws');
const server = new WebSocket.Server({
  port: 8080,
});

const max_players = 6;
const player_send_rate = 10; //ms

//NETWORK OBJECTS HERE

function HSMessage(id) {
  this.type = "hs";
  this.id = id;
}

function PlayerStatusMessage(id, name, x, y) {
  this.type = "stat";
  this.id = id;
  //to optimise, only set name once (make PlayerConnectMessage?)
  this.name = name;
  this.x = x;
  this.y = y;
}

function PlayerDisconnectMessage(id) {
  this.type = "disc";
  this.id = id;
}

//Data object for players[] array
function player_data_object(id) {
  this.id = id;
  //These values set after client returns handshake
  this.name;
  this.ready = false;
  this.socket;
  this.x;
  this.y;
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
  const hsMessage = new HSMessage(player_index);
  socket.send(JSON.stringify(hsMessage));

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
      players[player_index].socket = socket;
      players[player_index].x = msg.x;
      players[player_index].y = msg.y;
      players[player_index].ready = true;
      console.log(`[Handshake reply received] id:${player_index}, player_name: ${players[player_index].name}, x:${msg.x}, y: ${msg.y}`);
    }
    else if (msg.type == "stat") {
      if (msg.id != player_index) {
        console.log(`Mismatched ids received from player id ${player_index}! Closing connection.`);
        socket.terminate();
        return;
      }

      //console.log(`STATUS: ${players[player_index].name} id: ${msg.id} X: ${msg.x} Y: ${msg.y}`);
      players[player_index].x = msg.x;
      players[player_index].y = msg.y;
    }
  });

  // Attach onclose listener to connected socket
  socket.on('close', function() {
    players[player_index].ready = false;

    //Send disconnect message to all other players
    for (let i=0; i<max_players; i++) {
      if (i == player_index || typeof(players[i]) == 'undefined' || !players[i].ready)
        continue;

      const msg = JSON.stringify(new PlayerDisconnectMessage(player_index));
      players[i].socket.send(msg);
    }

    players[player_index] = undefined;
    console.log(`Client ${player_index} Disconnected!`);
  });
});

function sendPlayerData() {
  //Send each player
  for (let i=0; i<max_players; i++) {
    if (typeof(players[i]) == 'undefined')
      continue;

    //Every player in the array that is NOT them
    for (let j=0; j<max_players; j++) {
      if (j == i || typeof(players[j]) == 'undefined' || !players[j].ready)
        continue;

      const msg = JSON.stringify(new PlayerStatusMessage(j, players[j].name, players[j].x, players[j].y));
      if (players[i].ready) 
        players[i].socket.send(msg);
    }
  }
}

setInterval(sendPlayerData, player_send_rate);