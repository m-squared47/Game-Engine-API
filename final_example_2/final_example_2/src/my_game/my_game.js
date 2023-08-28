"use strict";  // Operate in Strict mode such that variables must be declared before used!

import engine from "../engine/index.js";

// user stuff
import Brain from "./objects/brain.js";
import Hero from "./objects/hero.js";

class MyGame extends engine.Scene {
    constructor() {
        super();
        this.kMinionSprite = "assets/minion_sprite.png";
        // The camera to view the scene
        this.mCamera = null;

        // For echo message
        this.mMsg = null;

        // the hero and the support objects
        this.mHero = null;
        this.mBrain = null;

        // mode of running: 
        //   H: Player drive brain
        //   J: Dye drive brain, immediate orientation change
        //   K: Dye drive brain, gradual orientation change
        this.mMode = 'H';
        this.dialogueFile = "assets/dialog1.json";
        
        this.mTextScrollBeep = "assets/sounds/beep.wav";
        this.mNextArrow = "assets/nextbutton.png";

        this.mCurrentDialog = null;
    }

    load() {
        engine.texture.load(this.kMinionSprite);
        engine.json.load(this.dialogueFile);   
        engine.texture.load(this.mNextArrow);
        engine.audio.load(this.mTextScrollBeep);
    }

    unload() {
        engine.texture.unload(this.kMinionSprite);
        engine.json.unload(this.dialogueFile);
        engine.texture.unload(this.mNextArrow);
        engine.audio.unload(this.mTextScrollBeep);
    }

    init() {
        let json = engine.json.get(this.dialogueFile);
        let lines = json["DialogLine"]
        for(let j = 0; j < lines.length; j++) {
            engine.texture.load(lines[j]["SpritePath"]);
            engine.font.load(lines[j]["NameFont"]);
            engine.font.load(lines[j]["ContentFont"]);
            engine.audio.load(lines[j]["ScrollAudio"]);
            engine.audio.load(lines[j]["LineAudio"]);
        }

        // Step A: set up the cameras
        this.mCamera = new engine.Camera(
            vec2.fromValues(50, 37.5),   // position of the camera
            100,                       // width of camera
            [0, 0, 640, 480]           // viewport (orgX, orgY, width, height)
        );
        this.mCamera.setBackgroundColor([0.8, 0.8, 0.8, 1]);
        // sets the background to gray

        // Create the brain  
        this.mBrain = new Brain(this.kMinionSprite);

        //  Create the hero object 
        this.mHero = new Hero(this.kMinionSprite);

        // For echoing
        this.mMsg = new engine.FontRenderable("Status Message");
        this.mMsg.setColor([0, 0, 0, 1]);
        this.mMsg.getXform().setPosition(1, 2);
        this.mMsg.setTextHeight(3);

        this.mRenderSet = new engine.GameObjectSet();

        this.textbox = new engine.Renderable(this.textBoxStyleTexture);
        this.textbox.setColor([0, 0, 0, 1]);
        this.textbox.getXform().setSize(90, 25);

        this.mBrainDialog = new engine.Dialog(engine.json.get(this.dialogueFile), this.mRenderSet, this.mCamera, this.mTextScrollBeep, this.textbox);
    }

    // This is the draw function, make sure to setup proper drawing environment, and more
    // importantly, make sure to _NOT_ change any state.
    draw() {
        // Step A: clear the canvas
        engine.clearCanvas([0.9, 0.9, 0.9, 1.0]); // clear to light gray

        // Step  B: Activate the drawing Camera
        this.mCamera.setViewAndCameraMatrix();

        // Step  C: Draw everything
        this.mHero.draw(this.mCamera);
        this.mBrain.draw(this.mCamera);

        //this.mMsg.draw(this.mCamera);
        this.mRenderSet.draw(this.mCamera);
    }

    // The update function, updates the application state. Make sure to _NOT_ draw
    // anything from this function!
    update() {

        let msg = "Brain [H:keys J:imm K:gradual]: ";
        let rate = 1;

        // get the bounding box for collision
        let hBbox = this.mHero.getBBox();
        let bBbox = this.mBrain.getBBox();
        
        if(hBbox.intersectsBound(bBbox)) {
            this.mCurrentDialog = this.mBrainDialog;
            this.mCurrentDialog.activate();
        }

        if(this.mCurrentDialog != null && this.mCurrentDialog.isActive()) {
            this.mCurrentDialog.update();
        } else {
            this.mHero.update();
        }

        if (engine.input.isKeyClicked(engine.input.keys.M)) {
            this.mCurrentDialog.setRepeatable(true);
        }

        switch (this.mMode) {
            case 'H':
                this.mBrain.update();  // player steers with arrow keys
                break;
            case 'K':
                rate = 0.02;    // gradual rate
            // no break here on purpose
            case 'J':
                if (!hBbox.intersectsBound(bBbox)) {  // stop the brain when it touches hero bound
                    this.mBrain.rotateObjPointTo(this.mHero.getXform().getPosition(), rate);
                    engine.GameObject.prototype.update.call(this.mBrain);  // the default GameObject: only move forward
                }
                break;
        }

        // Check for hero going outside 80% of the WC Window bound
        let status = this.mCamera.collideWCBound(this.mHero.getXform(), 0.8);

        if (engine.input.isKeyClicked(engine.input.keys.H)) {
            this.mMode = 'H';
        }
        if (engine.input.isKeyClicked(engine.input.keys.J)) {
            this.mMode = 'J';
        }
        if (engine.input.isKeyClicked(engine.input.keys.K)) {
            this.mMode = 'K';
        }
        this.mMsg.setText(msg + this.mMode + " [Hero bound=" + status + "]");
    }

    setCurrentDialog(other) {
        this.mCurrentDialog = other;
    }
}

window.onload = function () {
    engine.init("GLCanvas");

    let myGame = new MyGame();
    myGame.start();
}