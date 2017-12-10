$(() => {

  // connect to socket.io
  var socket = io.connect();

  // store elements to avoid re-querying
  var $window = $(window);
  var $body = $(document.body);

  // game turning
  var turn;    // positive indicates turn right, negative indicates turn left
  var pedal;   // positive indicates go forward, negative indicates go backward

  // device orientation test
  // doesn't seem to work with jQuery
  window.addEventListener("deviceorientation", function(event) {
    var turn = Math.floor((event.gamma > 0 ? -1 : 1) * event.beta); // turning the device sideways
    var pedal = Math.floor(45 - Math.abs(event.gamma));             // tilting the device forwards/backwards
                                                                    // straight up is no movement
    $("h1").text(Math.floor(turn) + " " + Math.floor(pedal));
  });

  // create renderer
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  var target = new THREE.Object3D();
  //camera.rotation.x = -Math.PI/2;
  //camera.position.y = 15;
  camera.position.z = 10;
  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  $body.prepend(renderer.domElement);

  var spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(0, 0, 10);
  scene.add(spotLight);

  var carShape = new THREE.Shape();
  carShape.moveTo(1, 0);
  carShape.lineTo(2, 0);
  carShape.lineTo(2, 2);
  carShape.lineTo(0, 2);
  carShape.lineTo(-1, 3);
  carShape.lineTo(-4, 3);
  carShape.lineTo(-5, 2);
  carShape.lineTo(-7, 2);
  carShape.lineTo(-7, 0);
  carShape.lineTo(-6, 0);
  carShape.arc(1, 0, 1, Math.PI, 0, true);
  carShape.lineTo(-1, 0);
  carShape.arc(1, 0, 1, Math.PI, 0, true);
  var carGeometry = new THREE.ExtrudeGeometry(carShape, {
    steps: 10,
    amount: 5,
    curveSegments: 10,
    bevelEnabled: false
  });
  var carMaterial = new THREE.MeshLambertMaterial({color: 0x0000ff});
  var carMesh = new THREE.Mesh(carGeometry, carMaterial);
  scene.add(carMesh);

  var wheelShape = new THREE.Shape();
  wheelShape.arc(0, 0, 0.8, 0, Math.PI*2);
  var wheelGeometry = new THREE.ExtrudeGeometry(wheelShape, {
    steps: 10,
    amount: 0.75,
    curveSegments: 10,
    bevelEnabled: false
  });
  var wheelMaterial = new THREE.MeshLambertMaterial({color: 0x00ff00});
  var wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
  var wheels = [];
  var wheelsCoordinates = [[0, 0], [0, 4.25], [-5, 0], [-5, 4.25]];
  for(var i = 0; i < 4; i++) {
    var newWheel = wheelMesh.clone();
    newWheel.position.x = wheelsCoordinates[i][0];
    newWheel.position.z = wheelsCoordinates[i][1];
    wheels.push(newWheel);
    carMesh.add(newWheel);
  }
  var pivot = new THREE.Object3D();
  pivot.add(carMesh);
  carMesh.applyMatrix( new THREE.Matrix4().makeTranslation(2.5, 0, -2.5));
  scene.add(pivot);

  function animate() {
    requestAnimationFrame(animate);
    pivot.rotation.y += 0.01;
    for(wheel of wheels) {
      wheel.rotation.z += 1;
    }
    renderer.render(scene, camera);
  }
  animate();

});
