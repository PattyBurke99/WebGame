const WebSocket = require('ws');
const server = new WebSocket.Server({
  port: 8080,
});

const max_players = 3;

//NETWORK OBJECTS HERE
function player_data_object(id, name, socket) {
  this.id = id;
  this.name = name;

  //Dont think this is needed but not sure
  //this.socket = socket;
}

function HsMessage(id, name) {
  this.type = "hs";
  this.id = id;
  this.name = name;
}

console.log("Server started");
let players = [];

server.on('connection', function(socket) {
    let player_index;

    console.log(`Client connecting...`);

    //Place new player in lowest undefined index in array
    for (let i=0; i < max_players; i++) {
      if (typeof(players[i]) == 'undefined') {
        players[i] = new player_data_object(i, "", socket);
        player_index = i;
        break;
      } 
    }

    //Occurs when max players is reached
    if (typeof player_index == 'undefined') {
      console.log("Refusing connection. Max players reached.");
      socket.close();
      return;
    }

    //Send handshake message to client, this tells client their player_index, they
    //will reply with their name which will be added to the player_data_object
    const hsMessage = new HsMessage(player_index, " ");
    socket.send(JSON.stringify(hsMessage));

    console.log(`Player connected with ID ${player_index}`);

    //Attach new message listener to connected socket
    socket.on('message', function(event) {
        const msg = JSON.parse(event);
        if (msg.type == "hs") {
          //CAN VERIFY IF msg.id is equal to player_index here for security
          //Close connection with message if these are mismatched!
          players[player_index].name = msg.name;
          console.log(`HS Reply received from player id:${player_index}, player_name: ${players[player_index].name}`)
        }
        else if (msg.type == "status") {
          console.log(`PLAYER ${msg.name}: X: ${msg.x} Y: ${msg.y}`);
        }
   });

   // Attach onclose listener to connected socket
    socket.on('close', function() {
        players[player_index] = undefined;
        console.log(`Client ${player_index} Disconnected!`);
    });
});