/*:
 * @target MZ
 * @plugindesc Show face actor auto by script call in show text.
 * @author Viet Pham
 *
 * @help
 * Show face actor auto by script call in show text.
*/

(() => {

    const parameters = PluginManager.parameters('FaceActorText');

    Game_Message.prototype.setFaceImage = function(faceName, faceIndex) {
        if((this._faceName == "" || this._faceName == null) && (faceName != null && faceName != "")){
            this._faceName = faceName;
            this._faceIndex = faceIndex;
        }
    };

    const _Window_Message_drawMessageFace = Window_Message.prototype.drawMessageFace;
    Window_Message.prototype.drawMessageFace = function() {
        _Window_Message_drawMessageFace.apply(this, arguments);
        $gameMessage.setFaceImage("",0);
    };
})();
