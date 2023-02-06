    //imports
    import * as THREE from 'three'
    import { OrbitControls } from 'OrbitControls';
    import { parseVXM } from "./js/vxmparser.js"

    // variable initialisation
    let isShiftDown = false;
    const objects = [];
    let controls

    // pencil eraser initialisation
    let pencilMode = true;

    // texture initialisation
    let plainTexture = true;

    // camera initialisation
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set( 500, 800, 1300 );
    camera.lookAt( 0, 0, 0 );

    // scene initialisation
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    // roll-over helpers (block preview)
    const rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );
    const rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xEAF35A, opacity: 0.8, transparent: true } );
    const rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
    scene.add( rollOverMesh );

    // cubes
    const cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
    const cubeMaterial = new THREE.MeshPhysicalMaterial({})
    cubeMaterial.reflectivity = 0.5
    cubeMaterial.roughness = 1
    cubeMaterial.metalness = 0
    cubeMaterial.clearcoat = 0
    cubeMaterial.clearcoatRoughness = 0
    cubeMaterial.color = new THREE.Color(0x4b4949)
    cubeMaterial.ior = 1.2
    cubeMaterial.thickness = 10.0

    // texture
    const texture = new THREE.TextureLoader().load( './assets/brick_roughness.jpg' );
    const material = new THREE.MeshBasicMaterial( { map: texture } );

    // grid
    const gridHelper = new THREE.GridHelper( 1000, 20 );
    scene.add( gridHelper );

    // raycaster
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // plane
    const geometry = new THREE.PlaneGeometry( 1000, 1000 );
    geometry.rotateX( - Math.PI / 2 );
    const plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xeeeeee } ) );
    scene.add( plane );
    objects.push( plane );

    // ambient light
    const ambientLight = new THREE.AmbientLight( 0x606060 );
    scene.add( ambientLight );

    // directional light
    const directionalLight = new THREE.DirectionalLight( 0xffffff );
    directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
    scene.add( directionalLight );

    // renderer
    const renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    controls.enableDamping = true;

    // load files
    const loader = new THREE.ObjectLoader();

    // loader.load(
    //     // resource URL
    //     "./testdsad.json",
    
    //     // onLoad callback
    //     // Here the loaded data is assumed to be an object
    //     // function ( obj ) {
    //     //     // Add the loaded object to the scene
    //     //     objects.push( obj );
    //     // },
    // )

    // const data = require("./testdsad.json");
    

    // addEventListeners
    document.addEventListener( 'pointermove', onPointerMove );
    document.addEventListener( 'pointerdown', onPointerDown );
    document.addEventListener( 'keydown', onDocumentKeyDown );
    document.addEventListener( 'keyup', onDocumentKeyUp );
	window.addEventListener( 'resize', onWindowResize );

    document.getElementById("reset-camera").addEventListener("click", resetCamera);
    document.getElementById("clear").addEventListener("click", clearScene);

    document.getElementById("pencil").addEventListener("click", modePencil);
    document.getElementById("eraser").addEventListener("click", modeEraser);

    document.getElementById("plain").addEventListener("click", modePlain);
    document.getElementById("brick").addEventListener("click", modeBricks);

    document.getElementById("print").addEventListener("click", print);
    document.getElementById("engrave").addEventListener("click", download);
    document.getElementById("minus").addEventListener("click", upload);

    // initial render
    render();

    let jui
    
    //FUNCTIONS ---------------------
    // async function importFile() {
    //     // import * as jui from "./testdsad.json" assert { type: "json" };
    //     // console.log(jui);
    //     // objects.push(jui);
    //     console.log("ENGRAVE");

    //     const requestURL = './testdsad.json';
    //     const request = new Request(requestURL);

    //     const response = await fetch(request);
    //     const superHeroes = await response.json();

    //     // logging(superHeroes);
    // }

    // function logging(obj) {
    //     console.log("Hi");
    //     console.log(JSON.parse(obj));
    //     // objects.push(obj);
    //     // scene.add(obj);
    //     render();
    // }

    let pendingChanges = false;
    

    function downloadFile(content, fileName, contentType) {
        const a = document.createElement('a');
        var file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        //URL.revokeObjectURL(a.href) (breaks firefox)
    }

    function download() {
        let content = []
        for (let x in objects) {
          if (objects[x].name == "block") {
            let material
            switch (objects[x].exterior) {
              case "plain":
                material = 0
                break
              case "bricks":
                material = 1
                break
            }
            console.log(objects[x].position)
            console.log(material)
            content.push({position: objects[x].position.toArray(), exterior: material})
          }
        }
        let name = prompt("Please enter the filename to save as", "build")
        console.log(name)
        if (!(name == null || name == "")) {
            pendingChanges = false
            downloadFile(JSON.stringify(content), name + ".vxm", "text/json")
        }
      }

    let save = [{"position":[-25,25,275],"exterior":1},{"position":[25,25,275],"exterior":1},{"position":[75,25,325],"exterior":0},{"position":[75,25,275],"exterior":0}]

    function upload() { 
        console.log("GRID");

        let objData
        objData = save;

        // remove stuff in scene
        for (let x in objects) {
            if (objects[x].name == "block") {
              console.log(x)
              scene.remove(objects[x])
            }
        }

        objects.splice(4, objects.length)
        let voxels = []

        for (let i in save) {
            switch (save[i]["exterior"]) {
                case 0:
                    voxel = new THREE.Mesh( cubeGeo, cubeMaterial)
                    console.log("WADW")
                  break
                case 1:
                    let voxel = new THREE.Mesh( cubeGeo, material)
                    console.log("WADW")
                  break
              }

            let voxel.name = "block"
            let pos = objdata[x]["position"]
            if (scale) {
            voxel.position.set(pos[0]/200, pos[1]/200, pos[2]/200)
            }
            else {
            voxel.position.fromArray(objdata[x]["position"])
            }
            voxels.push(voxel)
            for (let vox in voxels) {
                scene.add(voxels[vox])
                objects.push(voxels[vox])
              }
            console.log("Loaded file successfully")
            render()
        }
    

    };

    function print() {
        console.log("Objects:");
        console.log(objects[1].geometry);
        // const json = objects.toJSON();
        const json = JSON.stringify(objects);
        // console.log(json);
    }

    function modePencil() {
        pencilMode = true;
        console.log("PENCIL");
    }

    function modeEraser() {
        pencilMode = false;
        console.log("ERASER");
    }

    function modePlain() {
        plainTexture = true;
        console.log("PLAIN");
    }

    function modeBricks() {
        plainTexture = false;
        console.log("BRICKS");
    }
    
    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

        render();

    }
  
    function onPointerMove( event ) {

        pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

        raycaster.setFromCamera( pointer, camera );

        const intersects = raycaster.intersectObjects( objects, false );

        if ( intersects.length > 0 ) {

            const intersect = intersects[ 0 ];

            rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
            rollOverMesh.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );

            render();

        }
    }
  
    function onPointerDown( event ) {

        pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
        raycaster.setFromCamera( pointer, camera );
        const intersects = raycaster.intersectObjects( objects, false );
        
        if ( intersects.length > 0 ) {
            const intersect = intersects[ 0 ];
        
            // delete cube
            if ( isShiftDown || !pencilMode ) {
                if ( intersect.object !== plane ) { 
                    scene.remove( intersect.object );
                    objects.splice( objects.indexOf( intersect.object ), 1 );
                }
            } 

            // create cube  
            else {

                let voxel = new THREE.Mesh( cubeGeo, cubeMaterial );

                if ( !plainTexture ) {
                    voxel = new THREE.Mesh( cubeGeo, material );
                    voxel.exterior = "plain"
                }
                else {
                    voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
                    voxel.exterior = "bricks"
                }

                voxel.position.copy( intersect.point ).add( intersect.face.normal );
                voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
                voxel.name = "block"
                // voxel = JSON.parse(JSON.stringify(voxel));
                scene.add( voxel );
                objects.push( voxel );
                console.log(voxel);
                // console.log(objects);
            }
            render();
        }
    }
  
    function onDocumentKeyDown( event ) {
        switch ( event.keyCode ) {
        case 16: isShiftDown = true; break;
        }
    }
  
    function onDocumentKeyUp( event ) {
        switch ( event.keyCode ) {
            case 16: isShiftDown = false; break;
        }
    }
  
    function render() {
        requestAnimationFrame(render)  
        renderer.render( scene, camera );
        controls.update()
    }

    function resetCamera() {
        console.log("reset camera");
        camera.position.set( 500, 800, 1300 );
        camera.lookAt( 0, 0, 0 );
    }

    function clearScene() {
        for (let x in objects) { // scours through the objects in the scene
            if (objects[x].geometry.type == "BoxGeometry") { // makes sure only blocks are deleted, not the plane too
                // console.log(objects[x].geometry.type);
                // console.log(objects[x].geometry);
                scene.remove(objects[x])
            }
        }
    }