/*
 * scene file parsing utils
 */

// Engine utility stuff
import engine from "../engine/index.js";

class Dialog {
    
    constructor (json, renderSet, cam, scrollBeep = null, textBoxStyle) {
        this.mNextButton = "assets/nextbutton.png";
        this.count = 0;
        this.json = json;
        this.active = false;
        this.played = false;
        this.repeatable = false;
        this.name = null;
        this.content = null;
        this.bg = textBoxStyle;
        this.sprite = null;
        this.contentDone = false;

        this.mRenderSet = renderSet;
        this.mCamera = cam;
        this.mScrollBeep = scrollBeep;

        let center = this.mCamera.getWCCenter();
        this.mNextArrow = new engine.SpriteAnimateRenderable(this.mNextButton);
        this.mNextArrow.getXform().setPosition(center[0]+40 , center[1]-28);
        this.mNextArrow.getXform().setSize(2.5, 2.5);
        this.mNextArrow.setSpriteSequence(64, 0,
            64, 64, 
            2,
            0);
        this.mNextArrow.setAnimationType(engine.eAnimationType.eRight);
        this.mNextArrow.setAnimationSpeed(20);

    }

    update() {
        if(!this.contentDone && this.content.isDone()) {
            this.mRenderSet.addToSet(this.mNextArrow);
            this.contentDone = true;
        }

        if (engine.input.isKeyClicked(engine.input.keys.N)) {
            if(this.contentDone) {
                this.mRenderSet.removeFromSet(this.mNextArrow);
                this.contentDone = false;
                this.nextLine();
            } else {
                this.content.skip();
            }
        }
        if (this.content != null) {
            this.content.update();
        }
        this.mNextArrow.updateAnimation();

        if(this.sprite instanceof engine.SpriteAnimateRenderable) {
            if(this.content.isPaused() || this.content.isDone()) {
                this.sprite._initAnimation();
            } else {
                this.sprite.updateAnimation();
            }
        }
    }

    nextLine() {
        this.mRenderSet.removeFromSet(this.name);
        this.mRenderSet.removeFromSet(this.content);
        this.mRenderSet.removeFromSet(this.bg);
        this.mRenderSet.removeFromSet(this.sprite);

        let center = this.mCamera.getWCCenter();
        let line = this.json["DialogLine"][this.count];
        if(line != null) {
            //console.log(line["ContentFont"]);
            // Optional line audio
            if(line["LineAudio"] != undefined) {
                engine.audio.playCue(line["LineAudio"], 0.8);
            }

            // Character sprite
            // Checking if sprite is animated
            let params = line["SpriteAnimParams"];
            if(params == undefined) {
                this.sprite = new engine.SpriteRenderable(line["SpritePath"]);
            } else {
                let repeats = line["SpriteRepeats"] == false ? false : true;
                this.sprite = new engine.SpriteAnimateRenderable(line["SpritePath"], repeats);
                this.sprite.setSpriteSequence(params[0], params[1],
                    params[2], params[3], 
                    params[4],
                    params[5]);
                this.sprite.setAnimationType(engine.eAnimationType.eRight);
                this.sprite.setAnimationSpeed(7);
                //console.log("sprite defined");
            }
            // Handling sprite transform: Position
            this.sprite.getXform().setYPos(center[1] + 7);
            if(line["SpriteLocation"] == "Left") {
                this.sprite.getXform().setXPos(center[0] - 20);
            } else if(line["SpriteLocation"] == "Right") {
                this.sprite.getXform().setXPos(center[0] + 20);
            } else {
                let pos = center[0] - 20 + line["SpriteLocation"] * 40;
                this.sprite.getXform().setXPos(pos);
            }
            // Flipping sprite if optional flag is detected
            let flip = line["SpriteFlip"] == true ? -1 : 1
            this.sprite.getXform().setSize(30 * flip, 30);
            // Coloring sprite
            if(line["SpriteColor"] != undefined) {
                this.sprite.setColor(line["SpriteColor"]);
            }
            this.mRenderSet.addToSet(this.sprite);

            // Background
            this.bg.getXform().setPosition(center[0], center[1]-20);
            this.mRenderSet.addToSet(this.bg);

            // Name
            this.name = new engine.FontRenderable(line["Name"]);
            this.name.getXform().setPosition(center[0]-40, center[1]-11);
            this.name.getXform().setSize(1, 1);
            // Name Optional Parameters
            if(line["NameSize"] != undefined) {
                this.name.setTextHeight(line["NameSize"]);
            } else { 
                this.name.setTextHeight(2.5);
            }
            if(line["NameColor"] != undefined) {
                this.name.setColor(line["NameColor"]);
            } else {
                this.name.setColor([1, 1, 1, 1]);
            }
            if(line["NameFont"] != undefined) {
                this.name.setFontName(line["NameFont"]);
            }
            this.mRenderSet.addToSet(this.name);

            // Scrolling Line
            // All the optional parameters which can be given to ScrollingLine
            this.content = new engine.ScrollingFontRenderable(
                line["Content"],
                line["ScrollAudio"] == undefined      ? this.mScrollBeep : line["ScrollAudio"],
                line["Speed"] == undefined            ? null             : line["Speed"],
                line["SpeedChanges"] == undefined     ? null             : line["SpeedChanges"],
                line["Pauses"] == undefined           ? null             : line["Pauses"],
                line["ScrollPitch"] == undefined      ? null             : line["ScrollPitch"],
                line["ScrollPitchRange"] == undefined ? null             : line["ScrollPitchRange"]);
            this.content.getXform().setPosition(center[0]-40, center[1]-16);
            this.content.getXform().setSize(1, 1);
            // Scrolling line Optional Parameters
            if(line["ContentSize"] != undefined) {
                this.content.setTextHeight(line["ContentSize"]);
            } else { 
                this.content.setTextHeight(2.5);
            }
            if(line["ContentColor"] != undefined) {
                this.content.setColor(line["ContentColor"]);
            } else {
                this.content.setColor([1, 1, 1, 1]);
            }
            if(line["ContentFont"] != undefined) {
                this.content.setFontName(line["ContentFont"]);
            }
            this.mRenderSet.addToSet(this.content);
            this.count++;
        } else {
            this.deactivate();
            this.played = true;
            this.count = 0;
        }
    }

    isActive() {
        return this.active;
    }

    activate() {
        if(!this.active) {
            if(this.repeatable || !this.played) {
                this.active = true;
                this.nextLine();
            }
        }
    }

    deactivate() {
        this.active = false;
    }

    setRepeatable(repeatable) {
        this.repeatable = repeatable;
    }

    isReplayable() {
        return this.repeatable;
    }
    
}
export default Dialog;
