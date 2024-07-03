/*:
 * @target MZ
 * @plugindesc Allows players to have the ability to select from a collection of pictures.
 * @author Viet Pham
 * 
 * @param minScale
 * @text Min Scale
 * @desc The scale of the picture when it is not selected.
 * @type string
 * @default 1
 *
 * @param maxScale
 * @text Max Scale
 * @desc The scale of the picture when it is selected.
 * @type string
 * @default 1.5
 *
 * @param scalingSpeed
 * @text Scaling Speed
 * @desc The speed in which the pictures zoom when selecting them.
 * @type string
 * @default 0.04
 *
 * @param confirmSpeed
 * @text Confirm Speed
 * @desc The speed of the animation of a picture when it is chosen.
 * @type string
 * @default 0.2
 *
 * @param closeSpeed
 * @text Close Speed
 * @desc The speed of the animation of a picture when it closes.
 * @type string
 * @default 0.4
 * 
 * @param columns
 * @text Columns
 * @desc The speed of the animation of a picture when it closes.
 * @type string
 * @default 1
 * 
 * @param rows
 * @text Rows
 * @desc The speed of the animation of a picture when it closes.
 * @type string
 * @default 1
 * 
 * @help
 * This is a plugin that allows players to have the ability to select from 
 * a collection of pictures.
*/

var PictureChoices = PictureChoices || {};

var params = PluginManager.parameters('PictureChoices');

//-----------------------------------------------------------------------------
// Param Picture Choices
//-----------------------------------------------------------------------------

PictureChoices.minScale = parseFloat(params['minScale']);
PictureChoices.maxScale = parseFloat(params['maxScale']);
PictureChoices.scalingSpeed = parseFloat(params['scalingSpeed']);
PictureChoices.confirmSpeed = parseFloat(params['confirmSpeed']);
PictureChoices.closeSpeed = parseFloat(params['closeSpeed']);
PictureChoices.columns = parseFloat(params['columns']);
PictureChoices.rows = parseFloat(params['rows']);

function Window_PictureChoiceList() {
	this.initialize.apply(this, arguments);
}

function Sprite_PictureChoice() {
	this.initialize.apply(this, arguments);
}

(()=>{

    "use strict";

    var loadPicture = function(filename, hue) {
        return ImageManager.loadBitmap('img/choices/', filename, hue, true);
    };

    var matchesAny = function(name) {
        return !!name.match(/\\picture\[(.*)\]/i);
    };

    //-----------------------------------------------------------------------------
    // Game_Message
    //-----------------------------------------------------------------------------

    const _Game_Message_clear = Game_Message.prototype.clear;
    Game_Message.prototype.clear = function() {
        _Game_Message_clear.apply(this, arguments);
        this._isPictureChoices = false;
        this._pictureChoiceSize = [Graphics.boxWidth, Graphics.boxHeight];

        if(PictureChoices.columns == 1 && PictureChoices.rows == 1) {
            this._pictureChoiceGrid = [1, 1];
            this._customizedPictureChoiceGrid = false;
        } else {
            this._customizedPictureChoiceGrid = true;
            this._pictureChoiceGrid = [PictureChoices.columns, PictureChoices.rows];
        }
    };

    const _Game_Message_setChoices = Game_Message.prototype.setChoices;
    Game_Message.prototype.setChoices = function(choices, defaultType, cancelType) {
        this.pictureChoicesCheck(choices);
        _Game_Message_setChoices.apply(this, arguments);
    };

    Game_Message.prototype.pictureChoicesCheck = function(choices) {
        this._isPictureChoices = false;
        for(var i = 0; i < choices.length; i++) {
            if(matchesAny(choices[i])) {
                this._isPictureChoices = true;
                break;
            }
        }
        if(!this._customizedPictureChoiceGrid) {
            var amount = choices.length;
            if(amount === 1) this._pictureChoiceGrid = [1, 1];
            else if(amount === 2) this._pictureChoiceGrid = [2, 1];
            else if(amount === 3) this._pictureChoiceGrid = [3, 1];
            else if(amount === 4) this._pictureChoiceGrid = [2, 2];
            else if(amount === 5) this._pictureChoiceGrid = [5, 1];
            else if(amount === 6) this._pictureChoiceGrid = [6, 2];
        }
    };

    //-----------------------------------------------------------------------------
    // Window_Message
    //-----------------------------------------------------------------------------

    Scene_Message.prototype.createPictureChoiceListWindow = function() {
        this._pictureChoiceWindow = new Window_PictureChoiceList(this);
        this.addWindow(this._pictureChoiceWindow);
    };

    const _Scene_Message_Message_createAllWindows = Scene_Message.prototype.createAllWindows;
    Scene_Message.prototype.createAllWindows = function() {
        this.createPictureChoiceListWindow();
        _Scene_Message_Message_createAllWindows.apply(this, arguments);
    };

    const _Scene_Message_Message_associateWindows = Scene_Message.prototype.associateWindows
    Scene_Message.prototype.associateWindows = function() {
        _Scene_Message_Message_associateWindows.apply(this, arguments);
        const messageWindow = this._messageWindow;
        messageWindow.setPictureChoiceListWindow(this._pictureChoiceWindow);
        this._pictureChoiceWindow.setMessageWindow(messageWindow);      
    };

    Window_Message.prototype.setPictureChoiceListWindow = function(pictureChoiceWindow) {
        this._pictureChoiceWindow = pictureChoiceWindow;
    };

    const _Window_Message_initMembers = Window_Message.prototype.initMembers;
    Window_Message.prototype.initMembers = function() {
        this._pictureChoiceWindow = null;
        _Window_Message_initMembers.apply(this, arguments);
    };

    const _Window_Message_isAnySubWindowActive = Window_Message.prototype.isAnySubWindowActive;
    Window_Message.prototype.isAnySubWindowActive = function() {
        return _Window_Message_isAnySubWindowActive.apply(this, arguments) || this._pictureChoiceWindow.active;
    };

    const _Window_Message_startInput = Window_Message.prototype.startInput;
    Window_Message.prototype.startInput = function() {
        if($gameMessage._isPictureChoices && $gameMessage.isChoice()) {
            this._pictureChoiceWindow.start();
            return true;
        }
        return _Window_Message_startInput.apply(this, arguments);
    };

    //-----------------------------------------------------------------------------
    // Window_PictureChoiceList
    //-----------------------------------------------------------------------------

    Window_PictureChoiceList.prototype = Object.create(Window_ChoiceList.prototype);
    Window_PictureChoiceList.prototype.constructor = Window_PictureChoiceList;

    Window_PictureChoiceList.prototype._refreshAllParts = function() {};
    Window_PictureChoiceList.prototype._refreshCursor = function() {};

    const _Window_PictureChoiceList_initialize = Window_PictureChoiceList.prototype.initialize;
    Window_PictureChoiceList.prototype.initialize = function(messageWindow) {
        Window_ChoiceList.prototype.initialize.apply(this, arguments);
        this._spriteChoices = [];
    };

    Window_PictureChoiceList.prototype.updatePlacement = function() {
        this.width = this.windowWidth();
        this.height = this.windowHeight();
        this.x = (Graphics.boxWidth - this.width) / 2;
        this.y = (Graphics.boxHeight - this.height) / 2;
        if(!this._messageWindow.isClosed()) {
            if(this._messageWindow.y > Graphics.boxHeight/2) this.y -= this._messageWindow.height / 2;
            else if(this._messageWindow.y <= 0) this.y += this._messageWindow.height / 2;
        }
    };

    const _Window_PictureChoiceList_start = Window_PictureChoiceList.prototype.start;
    Window_PictureChoiceList.prototype.start = function() {
        this._spriteChoices.forEach(function(sprite) {
            if(sprite) {
                this.removeChild(sprite);
            }
        }, this);
        _Window_PictureChoiceList_start.apply(this, arguments);
    };

    Window_PictureChoiceList.prototype.setMessageWindow = function(messageWindow) {
        this._messageWindow = messageWindow;
    };

    Window_PictureChoiceList.prototype.windowWidth = function() {
        return $gameMessage._pictureChoiceSize[0];
    };

    Window_PictureChoiceList.prototype.windowHeight = function() {
        if(!this._messageWindow.isClosed()) {
            return $gameMessage._pictureChoiceSize[1] - this._messageWindow.height;
        }
        return $gameMessage._pictureChoiceSize[1];
    };

    Window_PictureChoiceList.prototype.maxCols = function() {
        return $gameMessage._pictureChoiceGrid[0];
    };

    Window_PictureChoiceList.prototype.numVisibleRows = function() {
        return $gameMessage._pictureChoiceGrid[1];
    };

    Window_PictureChoiceList.prototype.itemHeight = function() {
        return (this.contentsHeight() / this.numVisibleRows());
    };

    Window_PictureChoiceList.prototype.contentsHeight = Window_Base.prototype.contentsHeight;

    const _Window_PictureChoiceList_drawItem = Window_PictureChoiceList.prototype.drawItem;
    Window_PictureChoiceList.prototype.drawItem = function(index) {
        var name = this.commandName(index);
        var rect = this.itemRectWithPadding(index);
        if(name.match(/\\picture\[(.*)\]/i)) {
            if(this._spriteChoices[index]) this.removeChild(this._spriteChoices[index]);
            var imageName = String(RegExp.$1);
            var bit = loadPicture(imageName);
            var sprite = new Sprite_PictureChoice(bit);
            sprite.x = rect.x + (rect.width/2);
            sprite.y = rect.y + (rect.height/2);
            this._spriteChoices[index] = sprite;
            this.addChild(sprite);
        } else {
            var width = this.textWidthEx(name);
            var bit = new Bitmap(width, this.contents.fontSize + 4);
            var tempCont = this.contents;
            this.contents = bit;
            this.drawTextEx(name, 0, 0);
            this.contents = tempCont;
            var sprite = new Sprite_PictureChoice(bit);
            sprite.x = rect.x + (rect.width/2);
            sprite.y = rect.y + (rect.height/2);
            this._spriteChoices[index] = sprite;
            this.addChild(sprite);
        }
    };

    Window_PictureChoiceList.prototype.itemTextAlign = function() {
        return 'center';
    };

    var _Window_PictureChoiceList_update = Window_PictureChoiceList.prototype.update;
    Window_PictureChoiceList.prototype.update = function() {
        _Window_PictureChoiceList_update.apply(this, arguments);
        var length = this._spriteChoices.length;
        for(var i = 0; i < length; i++) {
            if(this._spriteChoices[i]) {
                if(this.index() === i) {
                    this._spriteChoices[i].updateIncrease();
                } else {
                    this._spriteChoices[i].updateDecrease();
                }
            }
        }
    };

    Window_PictureChoiceList.prototype.close = function() {
        for(var i = 0; i < this._spriteChoices.length; i++) {
            if(this._spriteChoices[i]) {
                if(i === this.index()) {
                    this._spriteChoices[i].startConfirm();
                } else {
                    this._spriteChoices[i].startDecline();
                }
            }
        }
        Window_ChoiceList.prototype.close.apply(this, arguments);
    };

    //-----------------------------------------------------------------------------
    // Sprite_PictureChoice
    //-----------------------------------------------------------------------------

    Sprite_PictureChoice.prototype = Object.create(Sprite.prototype);
    Sprite_PictureChoice.prototype.constructor = Sprite_PictureChoice;

    Sprite_PictureChoice.prototype.initialize = function() {
        Sprite.prototype.initialize.apply(this, arguments);
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this._breath = 1;
        this._direction = 0;
    };

    Sprite_PictureChoice.prototype.update = function() {
        Sprite.prototype.update.apply(this, arguments);
        if(this._direction) {
            if(this._direction === 1) {
                this.opacity -= (PictureChoices.closeSpeed * 100);
                this._breath += PictureChoices.closeSpeed;
                this.scale.x = this._breath;
                this.scale.y = this._breath;
                if(this.opacity <= 0) {
                    this._direction = 0;
                    this.parent.removeChild(this);
                }
            } else if(this._direction === 2) {
                this._breath -= PictureChoices.confirmSpeed;
                this.scale.x = this._breath;
                this.scale.y = this._breath;
                if(this._breath <= 0) {
                    this._direction = 0;
                    this.parent.removeChild(this);
                }
            }
        }
    };

    Sprite_PictureChoice.prototype.startConfirm = function() {
        this._direction = 1;
    };

    Sprite_PictureChoice.prototype.startDecline = function() {
        this._direction = 2;
    };

    Sprite_PictureChoice.prototype.updateIncrease = function() {
        if(this._breath < PictureChoices.maxScale) {
            this._breath += PictureChoices.scalingSpeed;
            this.scale.x = this._breath;
            this.scale.y = this._breath;
        }
    };

    Sprite_PictureChoice.prototype.updateDecrease = function() {
        if(this._breath > PictureChoices.minScale) {
            this._breath -= PictureChoices.scalingSpeed;
            this.scale.x = this._breath;
            this.scale.y = this._breath;
        }
    };

})();
