$(() => {

  // connect to socket.io
  var socket = io.connect();

  // store elements to avoid re-querying
  var $window = $(window);

  // device orientation test
  // doesn't seem to work with jQuery
  window.addEventListener("deviceorientation", function(event) {
    $("h1").text(JSON.stringify(event) + " " + Math.floor(event.alpha) + " " + Math.floor(event.beta) + " " + Math.floor(event.gamma));
  });

});
