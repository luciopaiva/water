
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

        // scene
        this.scene = new THREE.Scene();

        // renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x000000);
        document.body.appendChild(this.renderer.domElement);

        // display shader
        this.displayShader = new THREE.ShaderMaterial({
            depthTest: false,
            depthWrite: false,
            side: THREE.FrontSide,
            uniforms: {
                sampleTexture: { type: "t", value: this.makeSampleSquareTexture() }  // ToDo is `type` really used?
            },
            vertexShader: this.displayVertexShader,
            fragmentShader: this.displayFragmentShader,
        });

        // plane to show the shader's result (at [0,0,0], normal [0,0,1])
        const displayPlaneGeometry = new THREE.PlaneBufferGeometry(this.width, this.height);
        const displayPlaneMaterial = this.displayShader;
        this.displayPlane = new THREE.Mesh(displayPlaneGeometry, displayPlaneMaterial);
        // plane starts with normal at [0,0,-1], so we want to rotate it 180 deg to face the camera
        this.displayPlane.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.PI);
        this.scene.add(this.displayPlane);

        // camera at [0,0,0] looking at [0,0,0] with near frustum plane set accordingly to see the display plane
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        this.camera = new THREE.OrthographicCamera(-halfWidth, halfWidth, -halfHeight, halfHeight, 0);

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

    makeSampleSquareTexture() {
        const squareSide = 32;
        const size = squareSide * squareSide;  // this.width * this.width;
        const data = new Uint8Array(3 * size);

        const randomLevel = () => Math.floor(Math.random() * 256);

        for (let j = 0; j < squareSide; j++) {
            for (let i = 0; i < squareSide; i++) {
                const pos = j * squareSide + i;
                const stride = pos * 3;

                if (i === 0 || j === 0) {  // first column/row will be white
                    data[stride] = 255;
                    data[stride + 1] = 255;
                    data[stride + 2] = 255;
                } else if (i === squareSide - 1 || j === squareSide - 1) {  // last column/row will be black
                    data[stride] = data[stride + 1] = data[stride + 2] = 0;
                } else {  // random colors for everybody else
                    data[stride] = randomLevel();
                    data[stride + 1] = randomLevel();
                    data[stride + 2] = randomLevel();
                }
            }
        }

        const texture = new THREE.DataTexture(data, squareSide, squareSide, THREE.RGBFormat);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        return texture;
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
