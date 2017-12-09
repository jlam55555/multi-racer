$(() => {

  // connect to socket.io
  var socket = io.connect();

  // store elements to avoid re-querying
  var $window = $(window);

  // device orientation test
  $window.on("deviceorientation", (event) => {
    document.write(event.alpha + " " + event.beta + " " + event.gamma);
  });

});
