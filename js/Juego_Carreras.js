// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {TWEEN} from "../lib/tween.module.min.js";
import {GUI} from "../lib/lil-gui.module.min.js";

// Variables estandar
let renderer, scene, camera;

//Variables para la creación de obstaculos
let objectParent;
const n_obstaculos = 3;

//Variables de control de juego
let crash = false, start = false;

//Variables para el movimiento de los obstaculos
let time = 0;
let speedX = 10, speedZ = 0, translateZ = 0;
let clock = new THREE.Clock();

//Variables para la interacción con las luces focales
let spotLight1, spotLight2;

// Otras globales
let effectController;

//Creación de eventos para la interacción con el usuario
const bodyElement = document.querySelector("body");
bodyElement.addEventListener("keydown",KeyDown,false);
bodyElement.addEventListener('keyup',KeyUp,false);

// Acciones
init();
loadScene();
setupGUI();
render();

function init()
{
    // Instanciar el motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.antialias = true;
    renderer.setSize(window.innerWidth,window.innerHeight);
    document.getElementById('container').appendChild( renderer.domElement );
    
    // Instanciar el nodo raiz de la escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5,0.5,0.5);

    // Instanciar la camara
    camera= new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,1,100);
    camera.position.set(1,2.5,0);
    camera.lookAt(5,1,0);

    // Eventos
    window.addEventListener('resize', updateAspectRatio );
    renderer.domElement.addEventListener('dblclick', animate );
}

function loadScene()
{
    //Path a las imagenes del skybox y texturas para carretera
    const path ="./images/";

    // Material para la carretera
    const texsuelo = new THREE.TextureLoader().load(path+"road.jpg");
    texsuelo.repeat.set(10,1);
    texsuelo.wrapS= texsuelo.wrapT = THREE.RepeatWrapping;
    const material = new THREE.MeshLambertMaterial({color:'white',map:texsuelo});

    // Creación del Mesh que se usara para la carretera
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry(100,10, 100,10), material );
    suelo.rotation.x = -Math.PI/2;
    suelo.position.y = -0.2;
    suelo.receiveShadow = true;
    scene.add(suelo);

    //Iluminación compuesta por dos luces focales que apuntan al coche y una ligera luz ambiental
    const light = new THREE.AmbientLight(0x707070);
    scene.add(light);

    spotLight1 = new THREE.SpotLight( 0xffffff );
    spotLight1.position.set( 3, 3, 4 );
    spotLight1.target.position.set(4,1,0);
    spotLight1.castShadow = true;
    scene.add( spotLight1 );
    spotLight1.target.updateMatrixWorld();

    spotLight1.shadow.mapSize.width = 512;
    spotLight1.shadow.mapSize.height = 512;
    spotLight1.shadow.camera.near = 0.5;
    spotLight1.shadow.camera.far = 500;
    spotLight1.shadow.camera.fov = 30;

    spotLight2 = new THREE.SpotLight( 0xffffff );
    spotLight2.position.set( 3, 3, -4 );
    spotLight2.target.position.set(4,1,0);
    spotLight2.castShadow = true;
    scene.add( spotLight2 );
    spotLight2.target.updateMatrixWorld();

    spotLight2.shadow.mapSize.width = 512;
    spotLight2.shadow.mapSize.height = 512;
    spotLight2.shadow.camera.near = 0.5;
    spotLight2.shadow.camera.far = 500;
    spotLight2.shadow.camera.fov = 30;

    //Creación de los diversos modelos 3D a partir de los ficheros gltf
    //Todas los modelos se han descargado de la pagina: https://sketchfab.com/
    const glloader = new GLTFLoader();

    glloader.load( 'models/circle/scene.gltf', function ( gltf ) {
        gltf.scene.scale.set(0.1,0.1,0.1);
        gltf.scene.position.y = 0;
        gltf.scene.position.x = 0;
        gltf.scene.position.z = 0;
        gltf.scene.rotation.y = Math.PI/2;
        gltf.scene.name = 'circle';
        scene.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
    } );

    glloader.load( 'models/bike/scene.gltf', function ( gltf ) {
        const circle = scene.getObjectByName('circle');
        gltf.scene.scale.set(6,6,6);
        gltf.scene.position.y = 17.5;
        gltf.scene.position.x = 40;
        gltf.scene.position.z = -6.5;
        gltf.scene.rotation.y = 0;
        gltf.scene.name = 'bike';
        gltf.scene.traverse( function( node ) {
          if ( node.isMesh ) { node.castShadow = true; }
        } );
        circle.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
    } );

    glloader.load( 'models/aston/scene.gltf', function ( gltf ) {
        const circle = scene.getObjectByName('circle');
        gltf.scene.scale.set(1.5,1.5,1.5);
        gltf.scene.position.y = 9;
        gltf.scene.position.x = -40;
        gltf.scene.position.z = 0;
        gltf.scene.rotation.y = Math.PI/2;
        gltf.scene.name = 'aston';
        gltf.scene.traverse( function( node ) {
          if ( node.isMesh ) { node.castShadow = true; }
        } );
        circle.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
    } );

    glloader.load( 'models/porshe/scene.gltf', function ( gltf ) {
        const circle = scene.getObjectByName('circle');
        gltf.scene.scale.set(5,5,5);
        gltf.scene.position.y = 4;
        gltf.scene.position.x = 1.5;
        gltf.scene.position.z = 40;
        gltf.scene.rotation.y = Math.PI;
        gltf.scene.name = 'porshe';
        gltf.scene.traverse( function( node ) {
          if ( node.isMesh ) { node.castShadow = true; }
        } );
        circle.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
    } );

    glloader.load( 'models/kart/scene.gltf', function ( gltf ) {
        const circle = scene.getObjectByName('circle');
        gltf.scene.scale.set(0.08,0.08,0.08);
        gltf.scene.position.y = 5;
        gltf.scene.position.x = 0;
        gltf.scene.position.z = -40;
        gltf.scene.rotation.y = 0;
        gltf.scene.name = 'kart';
        gltf.scene.traverse( function( node ) {
          if ( node.isMesh ) { node.castShadow = true; }
        } );
        circle.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
    } );

    //Creación del skybox que encierra en su interior el entorno de juego
    const paredes = [];
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(path+"posx.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(path+"negx.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(path+"posy.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(path+"negy.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(path+"posz.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(path+"negz.jpg")}) );
    const habitacion = new THREE.Mesh( new THREE.BoxGeometry(100,100,100),paredes);
    scene.add(habitacion);
    
    //Creación del grupo de objetos conformado por los obstaculos y el plano que permite el movimiento
    objectParent = new THREE.Group();
    scene.add(objectParent);

    //Creación de los obstaculos
    for(let i=0;i<n_obstaculos;i++){
      spawnObstacle();
    }
    
}

function setupGUI()
{
	// Definicion de los controles
	effectController = {
		mensaje: 'Racing Example',
		foco1: true,
    sombras: true,
	};

	// Creacion interfaz
	const gui = new GUI();

	// Construccion del menu
	const h = gui.addFolder("Control de Aplicación");
	h.add(effectController, "mensaje").name("Aplicacion");
  h.add(effectController, "foco1")
  .onChange(v=>{
    if(v){
      spotLight1.intensity = 1;
      spotLight2.intensity = 1;
    }else{
      spotLight1.intensity = 0;
      spotLight2.intensity = 0;
    }
  }).name("Luces Focales");
  h.add(effectController, "sombras")
  .onChange(v=>{
    spotLight1.castShadow = v;
    spotLight2.castShadow = v;
  }).name("Sombras");

}

function render()
{
    requestAnimationFrame(render);
    update();
    renderer.render(scene,camera);
}

function update()
{
    time += clock.getDelta();
    translateZ += speedZ * -0.1;

    //Comprobamos si ya se ha elegido vehículo para el juego
    if(start){
      //En caso de producirse una colisión se detiene el juego
      if(!crash){
        objectParent.position.z = translateZ;
        objectParent.position.x = -speedX * time;
      }
  
      // Comprobamos si los obstaculos han superado la posición del vehículo
      // En caso de haberse sobrepasado se posiciona nuevamente al frente
      objectParent.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Object3D){
          const childXPos = child.position.x + objectParent.position.x;
          if (childXPos < 0){
            if(child.userData.type === 'obstaculo'){
              setupObstacle(child,-objectParent.position.x,-translateZ)
            }
          }
        }
      });
      
      //Comprobamos si se ha producido una colisión con el vehículo
      //En caso de producirse se establece la variable crash a true
      objectParent.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Object3D){
          const childXPos = child.position.x + objectParent.position.x;
          if(childXPos < 5 && childXPos > 2 && Math.abs(child.position.z - (-translateZ)) < 1){
            if(child.userData.type === 'obstaculo'){
              crash = true;
            }
          }
        }
      });
    }

    TWEEN.update();
}

function animate(event)
{
    // Capturar y normalizar
    let x= event.clientX;
    let y = event.clientY;
    x = ( x / window.innerWidth ) * 2 - 1;
    y = -( y / window.innerHeight ) * 2 + 1;


    // Construir el rayo y detectar la interseccion
    const rayo = new THREE.Raycaster();
    rayo.setFromCamera(new THREE.Vector2(x,y), camera);

    const circle = scene.getObjectByName('circle');
    const aston = scene.getObjectByName('aston');
    const porshe = scene.getObjectByName('porshe');
    const bike = scene.getObjectByName('bike');
    const kart = scene.getObjectByName('kart');

    let intersecciones = rayo.intersectObjects(aston.children,true);

    //En funcion del vehículo que sobre el que se haga doble click
    //se dara la vuelta al mismo y se iniciará el minijuego
    if( intersecciones.length > 0 ){
      new TWEEN.Tween(aston.rotation).
      to({x:0, y:3*Math.PI/2, z:0},1500).
      easing(TWEEN.Easing.Linear.None).
      start();
      new TWEEN.Tween(aston.position).
      to({x:-70},1500).
      easing(TWEEN.Easing.Linear.None).
      start();
      new TWEEN.Tween(circle.position).
      to({x:-3},1500).
      easing(TWEEN.Easing.Linear.None).
      start();
      start = true;
    }

    intersecciones = rayo.intersectObjects(porshe.children,true);

    if( intersecciones.length > 0 ){
      new TWEEN.Tween(porshe.rotation).
      to({x:0, y:0, z:0},1500).
      easing(TWEEN.Easing.Linear.None).
      start();
      new TWEEN.Tween(porshe.position).
      to({x:0,z:70},1500).
      easing(TWEEN.Easing.Linear.None).
      start();
      new TWEEN.Tween(circle.position).
      to({x:-3},1500).
      easing(TWEEN.Easing.Linear.None).
      start();
      start = true;
    }

    intersecciones = rayo.intersectObjects(bike.children,true);

    if( intersecciones.length > 0 ){
      new TWEEN.Tween(bike.rotation).
      to({y:Math.PI},1500).
      easing(TWEEN.Easing.Linear.None).
      start();
      new TWEEN.Tween(bike.position).
      to({x:70,z:6.5},1500).
      easing(TWEEN.Easing.Linear.None).
      start();
      new TWEEN.Tween(circle.position).
      to({x:-3},1500).
      easing(TWEEN.Easing.Linear.None).
      start();
      start = true;
    }

    intersecciones = rayo.intersectObjects(kart.children,true);

    if( intersecciones.length > 0 ){
      new TWEEN.Tween(kart.rotation).
      to({x:0, y:Math.PI, z:0},1500).
      easing(TWEEN.Easing.Linear.None).
      start();
      new TWEEN.Tween(kart.position).
      to({z:-70},1500).
      easing(TWEEN.Easing.Linear.None).
      start();
      new TWEEN.Tween(circle.position).
      to({x:-3},1500).
      easing(TWEEN.Easing.Linear.None).
      start();
      start = true;
    }
}

function KeyDown(event)
{
    const circle = scene.getObjectByName('circle');

    //En funcion de la tecla presionada se simula el movimiento en una dirección u otra
    if(!start){
      if ("ArrowRight" === event.key){
        console.log(event);
        new TWEEN.Tween(circle.rotation).
        to({x:0, y:circle.rotation.y+Math.PI/2, z:0},1500).
        easing(TWEEN.Easing.Linear.None).
        start();
      }
    }
    if(start){
      if ("a" === event.key){
        speedZ = 1;
      } 
      if ("d" === event.key){
        speedZ = -1;
      }
    }      
}

function KeyUp(event)
{
  //Al dejarse de presionar una tecla se reinicia el desplazamiento lateral
    if(start){
      if ("a" === event.key){
        speedZ = 0;
      }
      if ("d" === event.key){
        speedZ = 0;
      }
    } 
}

function spawnObstacle(){
    // Creamos los obstaculos del minijuego y los añadimos al grupo de objetos
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./models/cone/scene.gltf', (gltf) => {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh){
          scene.add(child)
          setupObstacle(child);
          objectParent.add(child)        
        }
      });
    });
}

function setupObstacle(obstaculo, refXPos = 0, refZPos = 0){
  //Colocamos cada uno de los obstaculos de forma aleatoria delante del vehículo
    obstaculo.rotation.x = 3*Math.PI/2;
    obstaculo.position.set(refXPos + 100 + THREE.MathUtils.randFloat(-30,0), 0.5, refZPos  + THREE.MathUtils.randFloat(-10,10))
    obstaculo.userData = { type: 'obstaculo' }
}

function updateAspectRatio()
{
    const ar = window.innerWidth/window.innerHeight;

    // Dimensiones del canvas
    renderer.setSize(window.innerWidth,window.innerHeight);

    // Reajuste de la relacion de aspecto de las camaras
    camera.aspect = ar;
    camera.updateProjectionMatrix();
    planta.updateProjectionMatrix();
}