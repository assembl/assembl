var $ = require('jquery'),
    Promise = require('bluebird');

/**
 * Creates a genie effect using CSS3 properties
 * @param  String   source      Jquery selector for source
 * @param  String   target      Jquery selector for target
 * @param  Number   duration    Duration of animation in milliseconds
 * @param  Number   delayTime   Time delay for promise in milliseconds (optional)
 *                              Defaults to 50% longer than duration
 * @returns Promise              Use promise to run a callback
 */

var _isNumber = function(obj) { return !isNaN(parseFloat(obj)); };

var effect = function($source, $target, duration, delayTime){
    if (!($source.jquery || $target.jquery)) {
        throw new Error("The genie effect was NOT passed a jquery object", $source, $target);
        return;
    }

    if (!(_isNumber(duration) )) {
        throw new Error("The genie effect's duration MUST be a Number type", duration);
        return;
    }

    if ( (delayTime !== undefined) && (!(_isNumber(delayTime))) ){
        throw new Error("The genie effect's delayTime MUST be a Number type", delayTime);
        return;
    }

    var t = duration/1000;
    var dt = delayTime || duration * 1.50;
    var genieEffect= {
        "-ms-transition": "all " + t + "s", //0.25s
        "-webkit-transition": "all " + t + "s", //0.25s
        "-moz-transition": "all " + t + "s", //0.25s
        "-o-transition": "all " + t + "s", //0.25s
        "transition": "all " + t + "s", //0.25s
    }

    var targetHeight = $target.height(),
        targetWidth = $target.width(),
        sourceHeight = $source.height(),
        sourceWidth = $source.width(),
        targetOffset = $target.offset(),
        sourceOffset = $source.offset(),
        diffX,
        diffY;
 
    var scaleY = targetHeight / sourceHeight,
        scaleX = targetWidth / sourceWidth;

    // var genieAnimation = {
    //     "-ms-transform": "scale(" + scaleX + ", " + scaleY + ") perspective(370px) rotateX(45deg)",
    //     "-webkit-transform": "scale(" + scaleX + ", " + scaleY + ") perspective(370px) rotateX(45deg)",
    //     "-moz-transform": "scale(" + scaleX + ", " + scaleY + ") perspective(370px) rotateX(45deg)",
    //     "-o-transform": "scale(" + scaleX + ", " + scaleY + ") perspective(370px) rotateX(45deg)",
    //     "transform": "scale(" + scaleX + ", " + scaleY + ") perspective(370px) rotateX(45deg)"
    // };

    var percent = 30,
        num = percent/100,
        factor = num + 1;

    var genieAnimation = {
        "-ms-transform": "perspective(370px) scale(0) rotateX(45deg)",
        "-webkit-transform": "perspective(370px) scale(0)  srotateX(45deg)",
        "-moz-transform": "perspective(370px) scale(0)  rotateX(45deg)",
        "-o-transform": "perspective(370px) scale(0)  rotateX(45deg)",
        "transform": "perspective(370px) scale(0) rotateX(45deg)"
    };    
    //Check who is on top
    if ((targetOffset.top - sourceOffset.top) < 0) {
        //Target is above
        diffY =  sourceOffset.top - (targetOffset.top + (targetHeight*0.5) );
        diffY = -1*diffY;
    }
    else if ( (targetOffset.top - sourceOffset.top) > 0 ) {
        //Target is below
        diffY = targetOffset.top + (targetHeight*0.5) - sourceOffset.height;
    }
    else {
        //Same level
        diffY = 0;
    }

    //Check who is on left
    if ( (targetOffset.left - sourceOffset.left) > 0) {
        //Target is on the right
        diffX =  sourceOffset.left - (targetOffset.left + (0.5*targetWidth));
        diffX = -1*diffX;
    }
    else if ( (targetOffset.left - sourceOffset.left) < 0 ){
        //target is on the left
        diffX = targetOffset.left + (targetWidth*0.5) - sourceOffset.left;
    }
    else {
        //Same level
        diffX = 0;
    }

    var origin = diffX + 'px ' + diffY + 'px'; //That space is very important in 'px '
        
    // console.log("[Genie Effect] origin is: ", origin);

    $source.css(genieEffect);
    $source.css({
        transformOrigin: origin
    });
    // $source.toggleClass("toggle-genie");
    $source.css(genieAnimation);
    return Promise.delay(dt);
};

var effect2 = function($source, $target, duration, delayTime){
    var targetHeight = $target.height(),
        targetWidth = $target.width(),
        targetOffset = $target.offset(),
        sourceOffset = $source.offset(),
        diffX = sourceOffset.left - targetOffset.left - targetWidth*0.5,
        diffY = sourceOffset.top - targetOffset.top - targetHeight*0.5,
        origin = -diffX + 'px' + -diffY + 'px';
    
    console.log("[Genie Effect] origin is: ", origin);

    $source.addClass("genie-effect");
    $source.css({
        transformOrigin: origin
    });
    $source.toggleClass("hide-genie");
    // $source.css(genieAnimation);
    return Promise.delay(delayTime);
};


module.exports = {
    geniefy: effect,
    geniefy2: effect2 
}
