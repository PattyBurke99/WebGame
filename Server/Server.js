const WebSocket = require('ws');
const server = new WebSocket.Server({
  port: 8080,
});

let player_index = 0;

// function pingPlayer() {
//   server.clients.forEach(function each(client) {
//     client.send("Hello");
//   });
// }

let players = [];
server.on('connection', function(socket) {
    players.push(socket);

    //SEND PLAYER HIS PLAYER INDEX HERE, DESIGN MESSAGING SYSTEM SERVER->CLIENT

    console.log(`Client connected! (${players.length})`);

    //When message received from a client
    socket.on('message', function(event) {
        //sockets.forEach(s => s.send(msg));
        const msg = JSON.parse(event);
        console.log(`${players.length} players connected.`);
        console.log(`PLAYER ${msg.net_name}: X: ${msg.net_x} Y: ${msg.net_y} dX: ${msg.net_dx} dY: ${msg.net_dy}`);
  });

  // When a socket closes, or disconnects, remove it from the array.
    socket.on('close', function() {
        players = players.filter(s => s !== socket);
        console.log("Client Disconnected!");
  });
});

function gameloop() {
    //Processing goes here
}



//setInterval(gameloop, 1000);
//setInterval(pingPlayer, 10000);