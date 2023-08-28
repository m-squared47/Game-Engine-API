/*
 * File: font_renderable.js
 *
 * Supports the drawing of a string based on a selected Font
 * 
 */

"use strict";

import Transform from "../transform.js";
import SpriteRenderable from "./sprite_renderable.js";
import * as defaultResources from "../resources/default_resources.js";
import * as font from "../resources/font.js";
import FontRenderable from "./font_renderable.js";
import engine from "../../engine/index.js";

class ScrollingFontRenderable extends FontRenderable {
    constructor(aString, scrollBeep, speed = null, speedChanges = null, pauses = null, scrollPitch, scrollPitchRange) {
        super(aString);
        this.stopIndex = 0;
        this.mTimer = 0;
        this.mPauseTimer = 0;
        this.mPaused = false;
        this.mSpeed = speed == null ? 2 : speed;
        this.mScrollBeep = scrollBeep;
        this.mSpeedChanges = speedChanges;
        this.mPauses = pauses;
        this.mScrollPitch = scrollPitch == null ? 1 : scrollPitch;
        this.mScrollPitchRange = scrollPitchRange == null ? 0 : scrollPitchRange;

        if(this.mSpeedChanges != null) {
            this.mSpeedChanges.sort((a,b) => {return a[0] - b[0];});
        }
        if(this.mPauses != null) {
            this.mPauses.sort((a,b) => {return a[0] - b[0];});
        }
        //console.log(this.mPauses);
    }

    draw(camera) {
        // we will draw the text string by calling to mOneChar for each of the
        // chars in the mText string.
        let widthOfOneChar = this.mXform.getWidth() / this.mText.length;
        let heightOfOneChar = this.mXform.getHeight();
        // this.mOneChar.getXform().SetRotationInRad(this.mXform.getRotationInRad());
        let yPos = this.mXform.getYPos();

        // center position of the first char
        let xPos = this.mXform.getXPos() - (widthOfOneChar / 2) + (widthOfOneChar * 0.5);
        let charIndex, aChar, charInfo, xSize, ySize, xOffset, yOffset;
        for (charIndex = 0; charIndex < this.stopIndex; charIndex++) {
            aChar = this.mText.charCodeAt(charIndex);
            charInfo = font.getCharInfo(this.mFontName, aChar);
            
            // set the texture coordinate
            this.mOneChar.setElementUVCoordinate(charInfo.mTexCoordLeft, charInfo.mTexCoordRight,
                charInfo.mTexCoordBottom, charInfo.mTexCoordTop);

            // now the size of the char
            xSize = widthOfOneChar * charInfo.mCharWidth;
            ySize = heightOfOneChar * charInfo.mCharHeight;
            this.mOneChar.getXform().setSize(xSize, ySize);

            // how much to offset from the center
            xOffset = widthOfOneChar * charInfo.mCharWidthOffset * 0.5;
            yOffset = heightOfOneChar * charInfo.mCharHeightOffset * 0.5;

            this.mOneChar.getXform().setPosition(xPos - xOffset, yPos - yOffset);

            this.mOneChar.draw(camera);

            xPos += widthOfOneChar;
            // Creating a new line if the sentence is too long
            if(xPos - this.mXform.getXPos() > 70 && this.mText[charIndex] == " ") {
                xPos = this.mXform.getXPos() - (widthOfOneChar / 2) + (widthOfOneChar * 0.5);
                yPos -= 2 * heightOfOneChar;
            }
        }
    }

    update() {
        if(this.mTimer == this.mSpeed) {
            if(this.mSpeedChanges != null && this.mSpeedChanges[0] != null && this.stopIndex == this.mSpeedChanges[0][0]) {
                this.mSpeed = this.mSpeedChanges[0][1];
                this.mSpeedChanges.shift();
            }
            if(this.mPauses != null && this.mPauses[0] != null && this.stopIndex == this.mPauses[0][0]) {
                this.mPaused = true;
                this.mPauseTimer = this.mPauses[0][1];
                this.mPauses.shift();
            }
            if(this.stopIndex < this.mText.length) {
                this.stopIndex++;
                let pitch = this.mScrollPitch - this.mScrollPitchRange / 2 + Math.random() * this.mScrollPitchRange;
                engine.audio.playCue(this.mScrollBeep, 0.8, pitch);
            }
            this.mTimer = 0;
        }
        if(this.mPauseTimer == 0) {
            this.mPaused = false;
        }
        if(this.mPaused) {
            this.mPauseTimer--;
        } else {
            this.mTimer++;
        }
    }

    skip() {
        this.stopIndex = this.mText.length;
    }

    isDone() {
        return this.stopIndex == this.mText.length;
    }

    isPaused() {
        return this.mPaused;
    }

    /*
     * this can be a potentially useful function. Not included/tested in this version of the engine

    getStringWidth(h) {
        let stringWidth = 0;
        let charSize = h;
        let charIndex, aChar, charInfo;
        for (charIndex = 0; charIndex < this.mText.length; charIndex++) {
            aChar = this.mText.charCodeAt(charIndex);
            charInfo = font.getCharInfo(this.mFont, aChar);
            stringWidth += charSize * charInfo.mCharWidth * charInfo.mXAdvance;
        }
        return stringWidth;
    }
    */
}

export default ScrollingFontRenderable;