//Extract URL arguments
const player_name = window.location.search.split("=")[1].split("&")[0];
const server_ip = window.location.search.split("=")[2];

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const ws = new WebSocket("ws://" + server_ip + ":8080");

let draw_process, net_process;
let is_connected = false;
let network_id;

let x = canvas.width/2;
let y = canvas.height/2;

let move_speed = 2;
let dx = 0;
let dy = 0;

//NETWORK MESSAGE OBJECTS HERE

function HsMessage(id, name) {
    this.type = "hs";
    this.id = id;
    this.name = name;
}

function StatusMessage(name, x, y) {
    this.type = "status";
    this.name = name;
    this.x = x;
    this.y = y;
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

//NETWORKED EVENTS GO HERE
ws.onopen = (event => {
    draw_process = setInterval(draw, 10);
    net_process = setInterval(sendLocation, 10000);
    is_connected = true;
});

ws.onclose = (event => {
    clearInterval(net_process);
    clearInterval(draw_process);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    alert("You have been disconnected from the server! Refresh the page.");
    is_connected = false;
});

ws.onmessage = (event => {
    const msg = JSON.parse(event.data);

    //Handshake with server, tell server your name
    if (msg.type == "hs") {
        //Reply to handshake with playername
        const hsMessage = new HsMessage(msg.id, player_name);
        ws.send(JSON.stringify(hsMessage));
    }
});

function sendLocation() {
    const player_data = new StatusMessage(player_name, x, y);
    ws.send(JSON.stringify(player_data));
}

//DRAWING CODE GOES HERE
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI*2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = "#000000";
    ctx.fillText(player_name, x - 11, y - 13);

    x += dx;
    y += dy;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
}