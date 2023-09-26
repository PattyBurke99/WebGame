//Extract URL arguments
const player_name = window.location.search.split("=")[1].split("&")[0];
const server_ip = window.location.search.split("=")[2];

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const ws = new WebSocket("ws://" + server_ip + ":8080");

const dataRate = 10; //ms
const drawRate = 10; //ms

let draw_process, net_process;
let is_connected = false;
let network_id;

let net_players = [];

let local_x = canvas.width/2;
let local_y = canvas.height/2;

let move_speed = 2;
let dx = 0;
let dy = 0;

//NETWORK MESSAGE OBJECTS HERE

function HsMessage(id, name) {
    this.type = "hs";
    this.id = id;
    this.name = name;
    //Starting location
    this.x = local_x;
    this.y = local_y;
}

function StatusMessage() {
    this.type = "status";
    this.id = network_id;
    this.x = local_x;
    this.y = local_y;
}

function net_player(id, name, x, y) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
}

//NETWORKED EVENTS GO HERE
ws.onopen = (event => {
    draw_process = setInterval(draw, drawRate);
    net_process = setInterval(sendLocation, dataRate);
    is_connected = true;
});

ws.onclose = (event => {
    clearInterval(net_process);
    clearInterval(draw_process);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    is_connected = false;

    alert("You have been disconnected from the server! Refresh the page.");
});

ws.onmessage = (event => {
    const msg = JSON.parse(event.data);
    //Handshake with server, tell server your name, x and y
    if (msg.type == "hs") {
        //Reply to handshake with playername
        network_id = msg.id;
        const hsMessage = new HsMessage(network_id, player_name);
        ws.send(JSON.stringify(hsMessage));
    } else if (msg.type == "status") {
        if (typeof(net_players[msg.id]) == 'undefined') {
            net_players[msg.id] = new net_player(msg.id, msg.name, msg.x, msg.y);
        }
        else {
            net_players[msg.id].x = msg.x;
            net_players[msg.id].y = msg.y;
        }
    } else if (msg.type == "disconnect") {
        //remove net_players object once they have disconnected
        net_players[msg.id] = undefined;
    }
});

function sendLocation() {
    ws.send(JSON.stringify(new StatusMessage()));
}

//INPUT EVENTS GO HERE
let map = {}; // You could also use an array
onkeydown = function(e){
    if (is_connected) {
        map[e.key] = e.type == 'keydown';
        if (map["a"]) {
            dx = -1;
        }
        if(map["d"]) {
            dx = 1;
        }
        if(map["s"]) {
            dy = 1;
        }
        if(map["w"]) {
            dy =- 1;
        }
    }
}

onkeyup = function(e){
    if (is_connected) {
        map[e.key] = e.type == 'keydown';
        if (!map["a"] || !map["d"]) {
            dx = 0;
        }
    
        if(!map["s"] || !map["w"]) {
            dy = 0;
        }
    }
}

//DRAWING CODE GOES HERE
function drawPlayer(name, player_x, player_y) {
    ctx.beginPath();
    ctx.arc(player_x, player_y, 10, 0, Math.PI*2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = "#000000";
    ctx.fillText(name, player_x - 11, player_y - 13);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer(player_name, local_x, local_y);
    local_x += dx;
    local_y += dy;

    for (let i=0; i<net_players.length; i++) {
        if (i == network_id || typeof(net_players[i]) == 'undefined')
            continue;

        drawPlayer(net_players[i].name, net_players[i].x, net_players[i].y);
    }
}