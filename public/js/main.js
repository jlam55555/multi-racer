$(() => {

  // connect to socket.io
  var socket = io.connect();

  // store elements to avoid re-querying
  var $window = $(window);

  // game turning
  var turn;    // positive indicates turn right, negative indicates turn left
  var pedal;   // positive indicates go forward, negative indicates go backward

  // device orientation test
  // doesn't seem to work with jQuery
  window.addEventListener("deviceorientation", function(event) {
    var turn = event.beta; // turning the device sideways
    var pedal = event.gamma - 90; // tilting the device forwards/backwards
                                  // straight up is no movement
    $("h1").text(turn + " " + pedal);
  });

});
