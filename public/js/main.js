$(() => {

  // connect to socket.io
  var socket = io.connect();

  // store elements to avoid re-querying
  var $window = $(window);
  var $body = $(document.body);
  var $generateCode = $("#generateCode");
  var $generatedCode = $("#generatedCode");
  var $verifiedCode = $("#verifiedCode");
  var $verifyCode = $("#verifyCode");

  // game turning
  var turn;    // positive indicates turn right, negative indicates turn left
  var pedal;   // positive indicates go forward, negative indicates go backward

  // create renderer
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  var target = new THREE.Object3D();
  camera.rotation.y = Math.PI/2;
  camera.position.y = 5;
  camera.position.x = 15;
  camera.position.z = 2.5;
  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  $body.prepend(renderer.domElement);

  var spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(0, 500, 0);
  scene.add(spotLight);

  var ambientLight = new THREE.AmbientLight(0x444444);
  scene.add(ambientLight);

  var Car = function() {
    this.carShape = new THREE.Shape();
    this.carShape.moveTo(1, 0);
    this.carShape.lineTo(2, 0);
    this.carShape.lineTo(2, 2);
    this.carShape.lineTo(0, 2);
    this.carShape.lineTo(-1, 3);
    this.carShape.lineTo(-4, 3);
    this.carShape.lineTo(-5, 2);
    this.carShape.lineTo(-7, 2);
    this.carShape.lineTo(-7, 0);
    this.carShape.lineTo(-6, 0);
    this.carShape.arc(1, 0, 1, Math.PI, 0, true);
    this.carShape.lineTo(-1, 0);
    this.carShape.arc(1, 0, 1, Math.PI, 0, true);
    this.carGeometry = new THREE.ExtrudeGeometry(this.carShape, {
      steps: 10,
      amount: 5,
      curveSegments: 10,
      bevelEnabled: false
    });
    this.carMaterial = new THREE.MeshLambertMaterial({color: 0x0000ff});
    this.carMesh = new THREE.Mesh(this.carGeometry, this.carMaterial);
    this.underCarGeometry = new THREE.BoxGeometry(7, 1, 3);
    this.underCarMesh = new THREE.Mesh(this.underCarGeometry, this.carMaterial);
    this.underCarMesh.position.y = 0.5;
    this.underCarMesh.position.z = 2.5;
    this.underCarMesh.position.x = -2.5;
    this.carMesh.add(this.underCarMesh);
    this.wheelShape = new THREE.Shape();
    this.wheelShape.arc(0, 0, 0.8, 0, Math.PI*2);
    this.wheelGeometry = new THREE.ExtrudeGeometry(this.wheelShape, {
      steps: 10,
      amount: 0.75,
      curveSegments: 10,
      bevelEnabled: false
    });
    this.wheelMaterial = new THREE.MeshLambertMaterial({color: 0x00ff00});
    this.wheelMesh = new THREE.Mesh(this.wheelGeometry, this.wheelMaterial);
    this.wheels = [];
    var wheelsCoordinates = [[0, 0], [0, 4.25], [-5, 0], [-5, 4.25]];
    for(var i = 0; i < 4; i++) {
      var newWheel = this.wheelMesh.clone();
      newWheel.position.x = wheelsCoordinates[i][0];
      newWheel.position.z = wheelsCoordinates[i][1];
      this.wheels.push(newWheel);
      this.carMesh.add(newWheel);
    }
    this.pivot = new THREE.Object3D();
    this.pivot.add(this.carMesh);
    this.carMesh.applyMatrix(new THREE.Matrix4().makeTranslation(2.5, 0, -2.5));
  };
  var car = new Car();
  scene.add(car.pivot);
  car.carMesh.add(camera);

  var otherCars = [];

  function animate() {
    requestAnimationFrame(animate);
    // set turn, pedal if missing
    if(true) {
      turn = 10;
      pedal = 10;
    }
    car.pivot.rotation.y -= 0.0001 * turn * pedal;
    for(wheel of car.wheels) {
      wheel.rotation.z += 0.01 * pedal;
    }
    car.pivot.translateX(-0.02 * pedal);
    renderer.render(scene, camera);
  }
  animate();

  // device orientation test
  // doesn't seem to work with jQuery
  window.addEventListener("deviceorientation", function(event) {
    turn = Math.floor((event.gamma > 0 ? -1 : 1) * event.beta); // turning the device sideways
    pedal = Math.floor(45 - Math.abs(event.gamma));             // tilting the device forwards/backwards
                                                                // 45 degree tilt is no movement
                                                                // TODO: allow tilt calibration to user
                                                                // TODO: allow portrait mode
    //$("h1").text(Math.floor(turn) + " " + Math.floor(pedal));
  });

  // get terrain map and implement
  socket.emit("getMap", function(mapData) {
    var elevations = mapData[0].map(e => e.r);
    var planeGeometry = new THREE.PlaneGeometry(500, 500, 9, 9);
    for(var i = 0; i < elevations.length; i++) {
      planeGeometry.vertices[i].z = elevations[i] / 255 * 100;
    }
    var planeMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      wireframe: true
    });
    var planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.rotation.x = -Math.PI/2;
    planeMesh.position.y = -30;
    scene.add(planeMesh);
  });

  // generate sync code
  $generateCode.click(() => {
    socket.emit("generateCode", (generatedCode) => {
      $generatedCode.text(generatedCode);
      socket.on("codeVerified", () => {
        $("h1").text("host " + generatedCode);
      })
    });
  });

  // verify sync code
  $verifyCode.click(() => {
    socket.emit("verifyCode", $verifiedCode.val(), (err) => {
      if(err) console.log(err);
      else $("h1").text("client " + $verifiedCode.val());
    });
  });

});
