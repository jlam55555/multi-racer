$(() => {

  // connect to socket.io
  var socket = io.connect();

  // store elements to avoid re-querying
  var $window = $(window);

  // device orientation test
  // doesn't seem to work with jQuery
  window.addEventListener("deviceorientation", function(event) {
    document.write(JSON.stringify(event), event.alpha + " " + event.beta + " " + event.gamma);
  });

});
