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
io.on("connection", function(socket) {
  console.log("a user has connected");
  sockets.push(socket);
  var socketId = sockets.length-1;

  // disconnect
  socket.on("disconnect", () => {
    sockets.splice(socketId, 1);
    // TODO: delete paired socket reference if necessary
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
    host.socketPair = socket;
    host.emit("codeVerified");
    fn();
  });
});
