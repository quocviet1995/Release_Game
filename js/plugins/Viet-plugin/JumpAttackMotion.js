/*:
 * @target MZ
 * @plugindesc Customizes the attack method and motion for Actor to jump to the target then return.
 * @author Viet Pham
 *
 * @param weaponTypeIds
 * @text Weapon Type Id
 * @desc This is an array parameter. Enter values separated by commas.
 * @type string
 * @default 1,2,3
 *
 * @help
 * This plugin modifies the attack method and motion of Actor.
*/

(() => {

    const parameters = PluginManager.parameters('JumpAttackMotion');

    // Get the parameter as a string
    const myArrayString = String(parameters['weaponTypeIds']);

    // Convert the string to an array
    const weaponTypeIds = myArrayString.split(',');

    // Now you can use the array in your plugin code.
    console.log(weaponTypeIds); // Output: ['value1', 'value2', 'value3']



    Game_Actor.prototype.isNormalAttack = function() {
        return this._isNormalAttack;
    };
    
    Game_Actor.prototype.normalAttack = function() {
        this._isNormalAttack = true;
    };

    Game_Actor.prototype.skillAttack = function() {
        this._isNormalAttack = false;
    };

    const _Scene_Battle_ionSkillOk = Scene_Battle.prototype.onSkillOk;

    Scene_Battle.prototype.onSkillOk = function() {
        BattleManager.actor().skillAttack();
        _Scene_Battle_ionSkillOk.apply(this, arguments);
    };

    const _Scene_Battle_commandAttack = Scene_Battle.prototype.commandAttack;
    Scene_Battle.prototype.commandAttack = function() {
        BattleManager.actor().normalAttack();
        _Scene_Battle_commandAttack.apply(this, arguments);
    };

    const _Game_BattlerBase_initMembers = Game_Battler.prototype.initMembers;

    Game_Battler.prototype.initMembers = function() {
        _Game_BattlerBase_initMembers.apply(this, arguments);
        this._isNormalAttack=false;
    };

    Sprite_Actor.prototype.updateTargetPosition = function() {
        if (this._actor.canMove() && BattleManager.isEscaped()) {
            this.retreat();
        } else if (this.shouldStepForward()) {
            if (this._actor.isInputting()){
                this.stepForward();
            } else if(this._actor.isActing()){
                this.jumpForward(this._actor);
            }
        } else if (!this.inHomePosition()) {
            this.stepBack();
        }
    };
    
    Sprite_Actor.prototype.jumpForward = function(action) {
        var item = $dataWeapons[action._equips[0]._itemId];

        if(weaponTypeIds.includes(item.wtypeId.toString())){

            var skillType = $dataSkills[action._lastBattleSkill._itemId];
            var isAttack = action._isNormalAttack;
            if(isAttack== false && skillType!= null && (skillType.hitType ==2 || skillType.hitType ==0) ){
                this.startMove(-48, 0, 12);
            }else{
                /*if(data._offsetX == data._targetOffsetX && data._targetOffsetX !=0){
                    this.startMove(data._targetOffsetX, 0, 12);
                }else{
                    var x = data._homeX;
                    var y = this._homeY;
                    var targetx = data._targetOffsetX;
                var distance = ( targetx - x)/2;
                this.startMove(distance, 0, 12);
                }*/
                //this.startMove(-300, 0, 12);
                this.startJump(-300,20,30,10); //constant variable for jump attck
            }
        }else{
            this.startMove(-48, 0, 12);
        }
    };
    
    //Update action actor when attack
    Game_Actor.prototype.performAction = function(action) {
        Game_Battler.prototype.performAction.call(this, action);
        if (action.isAttack()) {
            this.performAttack();
        } else if (action.isGuard()) {
            this.requestMotion("guard");
        } else if (action.isMagicSkill()) {
            var skillType = $dataSkills[action._item._itemId];
            if(skillType!= null && skillType.hitType !=0 ){
                this.performAttack();
            }else{
                this.requestMotion("spell");
            }
        } else if (action.isSkill()) {
            var skillType = $dataSkills[action._item._itemId];
            if(skillType!= null && skillType.hitType !=0 ){
                this.performAttack();
            }else{
                this.requestMotion("skill");
            }
        } else if (action.isItem()) {
            this.requestMotion("item");
        }
    };

    //Update update move , check for jump attack
    Sprite_Battler.prototype.updateMove = function() {
        if (this._movementDuration > 0) {
            const d = this._movementDuration;
            this._offsetX = (this._offsetX * (d - 1) + this._targetOffsetX) / d;
            this._offsetY = (this._offsetY * (d - 1) + this._targetOffsetY) / d;
    
            // Calculate the jump height using a parabolic equation
            if(this._jumpPeak >0){
                const jumpProgress = this._jumpPeak - Math.abs(d - this._jumpPeak);
                this._offsetY -= this._jumpHeight * (jumpProgress / this._jumpPeak) * (2 - jumpProgress / this._jumpPeak);
            }
    
            this._movementDuration--;
            if (this._movementDuration === 0) {
                this.onMoveEnd();
            }
        }
    };

    // Ví dụ: Nhân vật di chuyển đến vị trí (100, 50) trong 60 khung hình với độ cao nhảy là 20
    //spriteBattler.startJump(100, 50, 60, 20);
    //Create function for jump attack
    Sprite_Battler.prototype.startJump = function(x, y, duration, jumpHeight = 0) {
        if (this._targetOffsetX !== x || this._targetOffsetY !== y || this._jumpHeight !== jumpHeight) {
            this._targetOffsetX = x;
            this._targetOffsetY = y;
            this._movementDuration = duration;
            this._jumpHeight = jumpHeight;
            this._jumpPeak = duration / 2; // Set the peak of the jump to be halfway through the duration
    
            if (duration === 0) {
                this._offsetX = x;
                this._offsetY = y;
            }
        }
    };

    // Update functuon stepForward for move, remove variable jump
    const _Sprite_Actor_stepForward = Sprite_Actor.prototype.stepForward;
    Sprite_Actor.prototype.stepForward = function() {
        this._jumpHeight = 0;
        this._jumpPeak = 0;
        _Sprite_Actor_stepForward.apply(this, arguments);
    };
})();
