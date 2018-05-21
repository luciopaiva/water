
class MyApp {

    constructor (computeVertexShader, computeFragmentShader, displayVertexShader, displayFragmentShader,
                 scenarioTexture) {
        this.computeVertexShader = computeVertexShader;
        this.computeFragmentShader = computeFragmentShader;
        this.displayVertexShader = displayVertexShader;
        this.displayFragmentShader = displayFragmentShader;
        this.scenarioTexture = scenarioTexture;

        this.fpsCounterElement = document.getElementById("fps");
        this.fpsCounter = 0;
        setInterval(() => { this.fpsCounterElement.innerText = this.fpsCounter.toFixed(0); this.fpsCounter = 0}, 1000);

        // keep it a power of two and greater than the screen's greatest dimension so the plane fills the entire screen
        // do not grow it too much, though, since it will put more burden in the compute shader stage
        this.planeSize = 2048;

        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;

        // renderer (common to both compute and display scenes - see update())
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.windowWidth, this.windowHeight);
        this.renderer.setClearColor(0x000000);
        document.body.appendChild(this.renderer.domElement);

        this.initializeComputeScene();
        this.initializeDisplayScene();

        this.isPaused = false;
        this.update();
        document.addEventListener("keypress", event => {
            switch (event.key) {
                case "n":
                    this.isPaused && this.update(true);
                    break;
                case "p":
                    this.isPaused = !this.isPaused;
                    break;
                case "r":
                    this.initializeComputeScene();
                    break;
            }
        });
    }

    initializeComputeScene() {
        // camera at [0,0,0] looking at [0,0,0] with near frustum plane set accordingly to see the display plane
        const halfWidth = this.planeSize / 2;
        const halfHeight = this.planeSize / 2;
        this.backgroundCamera = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight);
        // move back a bit to see the plane
        this.backgroundCamera.position.z = 1;

        // scene
        this.backgroundScene = new THREE.Scene();

        // display shader
        this.computeShaderMaterial = new THREE.ShaderMaterial({
            depthTest: false,
            depthWrite: false,
            side: THREE.FrontSide,
            uniforms: {
                cellSize: { value: 1 / this.planeSize },
                sampleTexture: { value: this.scenarioTexture }
            },
            vertexShader: this.computeVertexShader,
            fragmentShader: this.computeFragmentShader,
        });

        // plane to show the shader's result (at [0,0,0], normal [0,0,1])
        const displayPlaneGeometry = new THREE.PlaneBufferGeometry(this.planeSize, this.planeSize);
        this.backgroundPlane = new THREE.Mesh(displayPlaneGeometry, this.computeShaderMaterial);
        this.backgroundScene.add(this.backgroundPlane);

        this.computeTargets = [
            MyApp.makeFrameBuffer(this.planeSize, this.planeSize),
            MyApp.makeFrameBuffer(this.planeSize, this.planeSize)
        ];
        this.computeTargetIndex = 0;

        // ToDo find out why can't use second renderer to compute (see update())
        // // renderer
        // this.backgroundRenderer = new THREE.WebGLRenderer();
        // this.backgroundRenderer.setPixelRatio(window.devicePixelRatio);
        // this.backgroundRenderer.setSize(this.planeSize, this.planeSize);
        // this.backgroundRenderer.setClearColor(0x000000);
        // this.backgroundRenderer.autoClear = false;

        // render first time so display renderer can start with something
        // this.backgroundRenderer.render(this.backgroundScene, this.backgroundCamera);
        // this.backgroundRenderer.render(this.backgroundScene, this.backgroundCamera);
        this.renderer.render(this.backgroundScene, this.backgroundCamera,
            this.computeTargets[this.computeTargetIndex], true);
        this.computeShaderMaterial.uniforms.sampleTexture.value = this.computeTargets[this.computeTargetIndex].texture;
    }

    initializeDisplayScene() {
        // camera at [0,0,0] looking at [0,0,0] with near frustum plane set accordingly to see the display plane
        // this.windowWidth = window.innerWidth;
        // this.windowHeight = window.innerHeight;
        const halfWidth = this.windowWidth / 2;
        const halfHeight = this.windowHeight / 2;
        const scalingFactor = 1;  // may want to increase this when debugging
        this.camera = new THREE.OrthographicCamera(-halfWidth * scalingFactor, halfWidth * scalingFactor,
            halfHeight * scalingFactor, -halfHeight * scalingFactor);
        // move back a bit to see the plane
        this.camera.position.z = 1;

        // scene
        this.scene = new THREE.Scene();

        // display shader
        this.displayShaderMaterial = new THREE.ShaderMaterial({
            depthTest: false,
            depthWrite: false,
            side: THREE.FrontSide,
            uniforms: {
                sampleTexture: { value: this.scenarioTexture }
                // sampleTexture: { value: this.computeTargets[this.computeTargetIndex].texture }
            },
            vertexShader: this.displayVertexShader,
            fragmentShader: this.displayFragmentShader,
        });

        // plane to show the shader's result (at [0,0,0], normal [0,0,1])
        const displayPlaneGeometry = new THREE.PlaneBufferGeometry(this.planeSize, this.planeSize);
        // ToDo use https://threejs.org/docs/#api/materials/Material.onBeforeCompile instead?
        // this.displayPlane = new THREE.Mesh(displayPlaneGeometry, new THREE.MeshBasicMaterial({ map: this.backgroundTarget.texture }));
        // this.displayPlane = new THREE.Mesh(displayPlaneGeometry, new THREE.MeshBasicMaterial({ map: this.scenarioTexture }));
        this.displayPlane = new THREE.Mesh(displayPlaneGeometry, this.displayShaderMaterial);
        this.scene.add(this.displayPlane);

        // // renderer
        // this.renderer = new THREE.WebGLRenderer();
        // this.renderer.setPixelRatio(window.devicePixelRatio);
        // this.renderer.setSize(this.windowWidth, this.windowHeight);
        // this.renderer.setClearColor(0x000000);
        // document.body.appendChild(this.renderer.domElement);

        this.renderer.render(this.scene, this.camera);
    }

    update(isSingleStep) {
        if (!isSingleStep) {
            // program next update
            requestAnimationFrame(this.update.bind(this, isSingleStep));
        }

        if (this.isPaused && !isSingleStep) {
            return;
        }

        // display latest computation...
        this.displayShaderMaterial.uniforms.sampleTexture.value = this.computeTargets[this.computeTargetIndex].texture;
        this.computeShaderMaterial.uniforms.sampleTexture.value = this.computeTargets[this.computeTargetIndex].texture;
        this.renderer.render(this.scene, this.camera);

        // and then compute a new one...

        this.computeTargetIndex = this.computeTargetIndex === 0 ? 1 : 0;

        // ToDo tried to compute in a separate renderer, but was unsuccessful (see comments below)
        //      screen renderer has smaller size, not desirable when calculating full simulation space
        //      find out what is wrong and use backgroundRenderer to compute instead
        //      (on the other hand... why do I need something bigger than the screen? Perhaps if I wanted to be able to
        //       scroll and zoom out... yeah, would be something cool to have)
        // this.backgroundRenderer.render(this.backgroundScene, this.backgroundCamera, this.backgroundTarget, true);
        this.renderer.render(this.backgroundScene, this.backgroundCamera,
            this.computeTargets[this.computeTargetIndex], true);

        this.fpsCounter++;
    }

    static makeFrameBuffer(width, height) {
        return new THREE.WebGLRenderTarget(width, height, {
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

    static async loadTexture(url) {
        return new Promise((resolve) => {
            new THREE.TextureLoader().load(url, (texture) => {
                texture.minFilter = THREE.NearestFilter;
                texture.magFilter = THREE.NearestFilter;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                resolve(texture);
            });
        });
    }

    static async run() {
        const computeVertexShader = await MyApp.getFile("compute-vertex-shader.glsl");
        const computeFragmentShader = await MyApp.getFile("compute-fragment-shader.glsl");
        const displayVertexShader = await MyApp.getFile("display-vertex-shader.glsl");
        const displayFragmentShader = await MyApp.getFile("display-fragment-shader.glsl");
        const scenarioTexture = await MyApp.loadTexture("scenario.png");
        new MyApp(computeVertexShader, computeFragmentShader, displayVertexShader, displayFragmentShader,
            scenarioTexture);
    }
}

window.addEventListener("load", () => MyApp.run());
