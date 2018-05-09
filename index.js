
class MyApp {

    static async run() {
        const vertexShader = await MyApp.getFile("vertex-shader-simulation.glsl");
        const fragmentShader = await MyApp.getFile("fragment-shader-simulation.glsl");
        const displayVertexShader = await MyApp.getFile("vertex-shader-display.glsl");
        const displayFragmentShader = await MyApp.getFile("fragment-shader-display.glsl");
        new MyApp(vertexShader, fragmentShader, displayVertexShader, displayFragmentShader);
    }

    constructor (vertexShader, fragmentShader, displayVertexShader, displayFragmentShader) {
        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;
        this.displayVertexShader = displayVertexShader;
        this.displayFragmentShader = displayFragmentShader;

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x000000);
        document.body.appendChild(this.renderer.domElement);
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        this.camera = new THREE.OrthographicCamera(-halfWidth, halfWidth, -halfHeight, halfHeight, -10000, 10000);

        this.displayShader = new THREE.ShaderMaterial({
            depthTest: false,
            side: THREE.DoubleSide,
            // uniforms: {
            // },
            vertexShader: this.displayVertexShader,
            fragmentShader: this.displayFragmentShader,
        });
        this.displayPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(this.width, this.height), this.displayShader);
        this.scene.add(this.displayPlane);

        // ToDo plug in initializeBackgroundStuff()

        this.update();
    }

    update() {
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.update.bind(this));
    }

    initializeBackgroundStuff() {
        // frames that will be periodically swapped during rendering
        this.foreground = MyApp.makeFrameBuffer();
        this.background = MyApp.makeFrameBuffer();

        this.backgroundScene = new THREE.Scene();
        this.backgroundCamera = new THREE.OrthographicCamera(-halfWidth, halfWidth, -halfHeight, halfHeight, -10000, 10000);

        this.simulationShader = new THREE.ShaderMaterial({
            uniforms: {

            },
            vertexShader: this.vertexShader,
            fragmentShader: fragmentShader,
        });

        this.backgroundPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(this.width, this.height), this.simulationShader);
        this.backgroundPlane.position.z = -100;
        this.backgroundScene.add(this.backgroundPlane);
    }

    static makeFrameBuffer() {
        return new THREE.WebGLRenderer(this.width, this.height, {
            minFilter: THREE.NearestFilter,  // so pixels appear sharp
            magFilter: THREE.NearestFilter,
            depthBuffer: false,  // turn it off; not needed
            stencilBuffer: false,  // turn it off; not needed
            wrapS: THREE.RepeatWrapping,  // ToDo find out if this is really needed
            wrapT: THREE.RepeatWrapping,
        });
    }

    static async getFile(url) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.addEventListener("load", function () {
                try {
                    resolve(this.responseText);
                } catch (error) {
                    reject(error);
                }
            });
            request.open("GET", url);
            request.send();
            request.addEventListener("error", reject)
        });
    }
}

window.addEventListener("load", () => MyApp.run());
