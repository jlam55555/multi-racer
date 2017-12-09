var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

io.on("connection", function(socket) {
  console.log("a user has connected");
});

app.use(express.static("public"));

http.listen(process.env.PORT || 5000);
