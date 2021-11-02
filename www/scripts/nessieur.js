/*
    Nessieur
    Marc Philippe Joly
    2021
*/

//========
// IMPORTS
//========

import * as THREE from './three/build/three.module.js'

//=======
// PARAMS
//=======


// ? Chez moi, avec MAX_POINTS à 2^20, on obtient en deux secondes de calcul de quoi rendre l'écran intéressant pendant plus d'une minute. Le temps réel est donc tout à fait envisageable au lieu du différé. Il faudrait seulement limiter le nombre de segments affichés à environ 2^16, même si beaucoup plus sont calculés, pour que le rendu vidéo puisse suivre à plus de 25rps.
// ! Chez moi, l'affichage rame visiblement au-delà de 2^19
let MAX_POINTS = 2 ** 18;
let DRAW_STEP = 200;
let STEP_SIZE = 1;
let CURVATURE = 0.05 // entre 0 et 1
let COMPLEXITY = 32;
let CAMERA_TYPE = "dancing around";
let CAMERA_DISTANCE = 250;
let FOG_COLOR = 0x000000;  // black
let FOG_DENSITY = 0.000125;


let renderer, scene, camera;
let line;

let drawCount;


//==========
// UTILITIES
//==========

// a simple 2D sized array builder
/**
 * @param {*} d1 
 * @param {*} d2 
 * @returns 
 */
function makeArray(d1, d2) {
    var arr = new Array(d1)
    for (var i = 0; i < d1; i++)
        arr[i] = new Array(d2)
    return arr
}

// a simple memoisation function
/**
 * ## memoized(f)
 * @decorator
 * @param {function} f 
 * @returns 
 */
const memoized = function (f) {
    const cache = {};
    return (...args) => {
        const key = JSON.stringify(args);
        return key in cache ? cache[key] : (cache[key] = f(...args));
    };
}

// factorial memoized
const factorial = memoized((n) => n < 2 ? 1 : n * factorial(n - 1));


//==================
//

function init() {

    const canvas = document.getElementById('canvas3D');

    // renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.antialias = false;

    // scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(FOG_COLOR, FOG_DENSITY);


    // camera
    camera = new THREE.PerspectiveCamera(120, canvas.clientWidth / canvas.clientHeight, CAMERA_DISTANCE / 10, CAMERA_DISTANCE * 1000);

    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, 0);

    // geometry
    const geometry = new THREE.BufferGeometry();

    // attributes
    const positions = new Float32Array(MAX_POINTS * 3); // 3 values per point
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // drawcalls
    drawCount = 2; // draw the first 2 points, only
    geometry.setDrawRange(0, drawCount);

    // material
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

    // line
    line = new THREE.Line(geometry, material);
    scene.add(line);

    // update positions
    updatePositions();

}

/**
 * ## updatePositions()
 * 
 * 
 */
function updatePositions() {
    const positions = line.geometry.attributes.position.array;
    const pi2 = 2 * Math.PI;
    let x, y, z, index;
    x = y = z = index = 0;
    let a = makeArray(COMPLEXITY, 3);
    for (var i = 0; i < COMPLEXITY; i++) {
        a[i][0] = (pi2 * (Math.random() - 0.5) * CURVATURE ** factorial(i + 1));
        a[i][1] = (pi2 * (Math.random() - 0.5) * CURVATURE ** factorial(i + 1));
        a[i][2] = (pi2 * (Math.random() - 0.5) * CURVATURE ** factorial(i + 1));
    }

    for (var i = 0, max = MAX_POINTS; i < max; i++) {

        positions[index++] = x;
        positions[index++] = y;
        positions[index++] = z;

        for (let i = COMPLEXITY - 1; i > 0; i--) {
            a[i - 1][0] += a[i][0] % pi2;
            a[i - 1][1] += a[i][1] % pi2;
            a[i - 1][2] += a[i][2] % pi2;
        }

        x += (Math.cos(a[0][0]) + Math.sin(a[0][2])) * STEP_SIZE;
        y += (Math.sin(a[0][0]) + Math.cos(a[0][1])) * STEP_SIZE;
        z += (Math.sin(a[0][1]) + Math.cos(a[0][2])) * STEP_SIZE;
    }
}

// render
function render() {
    renderer.render(scene, camera);
}

// whereToLookAt
// meansize: la taille de l'intervale de points sur lequel évaluer la position vers laquelle regarder
function whereToLookAt(meanSize) {
    const positions = line.geometry.attributes.position.array;
    const startIndex = drawCount - Math.floor(meanSize / 2);
    const endIndex = startIndex + meanSize;
    let point = [0, 0, 0];
    for (let i = startIndex; i < endIndex; i++) {
        let index = Math.min(MAX_POINTS - 1, Math.max(0, i));
        point[0] = point[0] + positions[index * 3];
        point[1] = point[1] + positions[index * 3 + 1];
        point[2] = point[2] + positions[index * 3 + 2];
    };
    point[0] /= meanSize;
    point[1] /= meanSize;
    point[2] /= meanSize;
    return new THREE.Vector3(point[0], point[1], point[2]);
}

// whereToLookFrom
function whereToLookFrom(toWhere) {
    const pi2 = Math.PI * 2;
    const a = pi2 * drawCount / MAX_POINTS;
    let fromWhere = new THREE.Vector3();
    switch (CAMERA_TYPE) {
        case "inside":
            return new THREE.Vector3(0, 0, 0);
            break;
        case "flying with":
            return new THREE.Vector3(toWhere.x * 1.5, toWhere.y * 1.5, toWhere.z * 1.5);
            break;
        case "dancing around":
            let toWhereNorm = toWhere.clone().normalize();
            fromWhere.x = toWhere.x + toWhereNorm.y * CAMERA_DISTANCE * Math.sin(a);
            fromWhere.y = toWhere.y + toWhereNorm.z * CAMERA_DISTANCE * Math.cos(a) * Math.sin(pi2 + a);
            fromWhere.z = toWhere.z + toWhereNorm.x * CAMERA_DISTANCE * Math.cos(pi2 + a);
            break;
    }
    return fromWhere;
}

function restart() {
    drawCount = 0; // for if modulo left drawCount somewhere between 0 and drawStep
    // periodically, generate new data
    updatePositions();
    line.geometry.attributes.position.needsUpdate = true; // required after the first render
}

// animate
function animate(timestamp) {

    const positions = line.geometry.attributes.position.array;

    drawCount = (drawCount + DRAW_STEP) % MAX_POINTS;
    line.geometry.setDrawRange(0, drawCount);
    if (drawCount < DRAW_STEP) {
        restart()
    }

    const where_to_look_at = whereToLookAt(Math.floor(DRAW_STEP * 60 * 5));
    camera.position.copy(whereToLookFrom(where_to_look_at));
    camera.lookAt(where_to_look_at);
    const color = where_to_look_at.clone().normalize();
    line.material.color = new THREE.Color((color.x + 1) / 2, (color.y + 1) / 2, (color.z + 1) / 2);

    render();

    requestAnimationFrame(animate);
}



/**
 * ## defered execution
 * We wait for the DOMContentLoaded event before runing
 */
window.addEventListener('DOMContentLoaded', (event) => {
    init();
    const restartButton = document.getElementById('restart_button');
    restartButton.addEventListener("mousedown", restart);
    animate();
}, { once: true })
