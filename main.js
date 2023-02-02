    //imports
    import * as THREE from 'three'
    import { OrbitControls } from 'OrbitControls';

    // variable initialisation
    let isShiftDown = false;
    const objects = [];
    let controls

    // camera initialisation
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set( 500, 800, 1300 );
    camera.lookAt( 0, 0, 0 );

    // scene initialisation
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    // roll-over helpers
    const rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );
    const rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
    const rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
    scene.add( rollOverMesh );

    // cubes
    const cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
    const cubeMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00, opacity: 0.5, transparent: true } );

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

    //orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    controls.enableDamping = true;

    // addEventListeners
    document.addEventListener( 'pointermove', onPointerMove );
    document.addEventListener( 'pointerdown', onPointerDown );
    document.addEventListener( 'keydown', onDocumentKeyDown );
    document.addEventListener( 'keyup', onDocumentKeyUp );
	window.addEventListener( 'resize', onWindowResize );

    // initial render
    render();
    
    //FUNCTIONS ---------------------
    
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
            if ( isShiftDown ) {
                if ( intersect.object !== plane ) { 
                    scene.remove( intersect.object );
                    objects.splice( objects.indexOf( intersect.object ), 1 );
                }
            } 

            // create cube  
            else {
                const voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
                voxel.position.copy( intersect.point ).add( intersect.face.normal );
                voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
                scene.add( voxel );
                objects.push( voxel );
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