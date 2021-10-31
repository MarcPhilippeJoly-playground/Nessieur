/*
    Responsive Three
    Marc Philippe Joly
    2021

    Method to give to THREE renderers and cameras so they automatically resize according to DOM content actual size anytime DOM content resize.
*/

function unmakeResponsive(thing) {
    try {
        window.removeEventListener('resize', resizeToDisplaySize)
    } finally {
        // there is no listener to remove, so what ?
    }
}

function makeResponsive(renderer) {

    // Par prudence, on s'assurer de détacher l'écouteur d'événement éventuellement déjà installés par un précédent appel à makeResponsive ou autre qui ferait doublon.
    unmakeResponsive(renderer);

    // Ensuite, on attache à nouveau proprement l'écouteur d'événement
    window.addEventListener('resize', resizeToDisplaySize);

    /* resising renderer*/
    const resizeToDisplaySize = function resizeToDisplaySize() {
        const canvas = renderer.domElement;

        // look up the size the canvas is being displayed
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // adjust displayBuffer size to match
        if (canvas.width !== width || canvas.height !== height) {
            // you must pass false here or three.js sadly fights the browser
            renderer.setSize(width, height, false);
        }
    }
}


function refitToDisplaySize(camera,zone) {
    camera.aspect = zone.width / zone.height;
    camera.updateProjectionMatrix();
}





renderer.domElement