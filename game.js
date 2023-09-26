const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const ws = new WebSocket("ws://localhost:8080");

let draw_process, net_process;
let is_connected = false;

let x = canvas.width/2;
let y = canvas.height/2;

let move_speed = 2;
let dx = 0;
let dy = 0;

//Extract the player name from the url arguments
let url = window.location.search;
let url_arguments = url.split("=");
const player_name = url_arguments[1];

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
    net_process = setInterval(sendLocation, 2000);
    is_connected = true;
});

ws.onclose = (event => {
    clearInterval(net_process);
    clearInterval(draw_process);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    alert("You have been disconnected from the server! Refresh the page.");
    is_connected = false;
});

ws.onmessage = (message) => {
    // alert("Data received from server!");
}

function sendLocation() {
    const player_data = {
        net_name: player_name,
        net_x: x,
        net_y: y,
        net_dx: dx,
        net_dy: dy,
    };

    ws.send(JSON.stringify(player_data));
}

//DRAWING CODE GOES HERE
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI*2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();

    x += dx;
    y += dy;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
}