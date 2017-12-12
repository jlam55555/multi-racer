/******************************************************************************
██████   ██████  ██    ██ ████████ ██ ███    ██  ██████
██   ██ ██    ██ ██    ██    ██    ██ ████   ██ ██
██████  ██    ██ ██    ██    ██    ██ ██ ██  ██ ██   ███
██   ██ ██    ██ ██    ██    ██    ██ ██  ██ ██ ██    ██
██   ██  ██████   ██████     ██    ██ ██   ████  ██████
******************************************************************************/
var express = require("express");
var app = express();
var http = require("http").Server(app);
app.use(express.static("public"));
http.listen(process.env.PORT || 5000);

/******************************************************************************
 ██████  ████████ ██   ██ ███████ ██████      ██████  ███████ ██████  ███████
██    ██    ██    ██   ██ ██      ██   ██     ██   ██ ██      ██   ██ ██
██    ██    ██    ███████ █████   ██████      ██   ██ █████   ██████  ███████
██    ██    ██    ██   ██ ██      ██   ██     ██   ██ ██      ██           ██
 ██████     ██    ██   ██ ███████ ██   ██     ██████  ███████ ██      ███████
******************************************************************************/
// use this for interpreting map data
var pixelGetter = require("pixel-getter");

/******************************************************************************
███████  ██████   ██████ ██   ██ ███████ ████████ ██  ██████
██      ██    ██ ██      ██  ██  ██         ██    ██ ██    ██
███████ ██    ██ ██      █████   █████      ██    ██ ██    ██
     ██ ██    ██ ██      ██  ██  ██         ██    ██ ██    ██
███████  ██████   ██████ ██   ██ ███████    ██ ██ ██  ██████
******************************************************************************/
var io = require("socket.io")(http);
var sockets = [];
var cars = [];
io.on("connection", function(socket) {
  console.log("a user has connected");
  sockets.push(socket);
  socket.socketId = sockets.length-1;

  // disconnect
  socket.on("disconnect", () => {
    sockets.splice(socket.socketId, 1);
    // TODO: delete paired socket reference if necessary
    for(var i = 0; i < sockets.length; i++) {
      sockets[i].socketId--;
    }
  });

  // return map pixel data
  socket.on("getMap", fn => {
    pixelGetter.get("./maps/map.png", function(error, pixels) {
      if(error) {
        console.log("Error retrieving map image data: " + error);
        return;
      }
      fn(pixels);
    });
  });

  // generate and return code
  socket.on("generateCode", fn => {
    for(var i = 0, code = ""; i < 5; i++) {
      code += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
    }
    // TODO: make sure codes are unique
    // TODO: make sure user is not already assigned a code, or disconnect them and all connected codes
    socket.code = code;
    socket.host = true;
    fn(code);
  });

  // verify code
  socket.on("verifyCode", (code, fn) => {

    //console.log(Object.keys(sockets));
    //sockets.filter(s => console.log(s.code, code, s.code === code && s.host));

    // only match sockets that are hosts and that have a matching code
    var matchingCodeHosts = sockets.filter(s => s.code === code && s.host);
    // if code nonexistant return error
    if(matchingCodeHosts.length === 0) {
      return fn("code doesn't exist");
    }

    // if something is already connected return error
    if(sockets.filter(s => s.code === code && !s.host).length > 0) {
      return fn("host already matched");
    }
    // if host is self return error
    if(matchingCodeHosts[0].id === socket.id) {
      return fn("host cannot be client");
    }
    // success! set code, host, and socketPair (for both)
    var host = matchingCodeHosts[0];
    socket.code = code;
    socket.host = false;
    socket.socketPair = host;
    //host.socketPair = socket;
    var carInfo = {
      code: code,
      /*host: host,
      client: socket,*/
      x: Math.random()*20 - 10,
      y: 0,
      z: Math.random()*20 - 10,
      turn: 0,
      pedal: 0,
      direction: Math.random() * 2 * Math.PI
    };
    cars.push(carInfo);
    host.car = carInfo;
    // TODO: delete carInfo on socket exit
    host.emit("codeVerified");
    host.emit("mapUpdate", carInfo);
    fn();
  });

  // device orientation update
  socket.on("deviceorientation", function(turn, pedal) {
    if(socket.host === false && (socket.socketPair && socket.socketPair.code === socket.code)) {
      socket.socketPair.car.turn = turn;
      socket.socketPair.car.pedal = pedal;
      //console.log(turn, pedal);
    }
  });

  // emit location every so often if host
  setInterval(function() {
    if(socket.car !== undefined && socket.host === true) { // TODO: change .host to .isHost
      socket.emit("mapUpdate", socket.car);
    }
  }, 10);
});

setInterval(() => {
  for(var i = 0; i < cars.length; i++) {

    var car = cars[i];
    car.direction -= 0.0001 * car.turn * car.pedal;
    //console.log(car.direction);

    // for dev purposes
    //car.turn = 10;
    //car.pedal = 10;

    /*for(wheel of car.wheels) {
      wheel.rotation.z += 0.01 * pedal;
    }*/
    //car.pivot.translateX(-0.02 * pedal);
    var distance = 0.05 * car.pedal;
    car.x -= Math.cos(car.direction) * distance;
    car.z += Math.sin(car.direction) * distance;
  }
}, 10);
