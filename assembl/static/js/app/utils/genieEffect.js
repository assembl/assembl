var $ = require('../shims/jquery.js'),
    Promise = require('bluebird');

/**
 * Creates a genie effect using CSS3 properties
 * @param  String   source      Jquery selector for source
 * @param  String   target      Jquery selector for target
 * @param  Number   duration    Duration of animation in SECONDS
 * @param  Number   delayTime   Time delay for promise
 * @return Promise              Use promise to run a callback
 */
var effect = function($source, $target, duration, delayTime){
    var genieEffect= {
        "-ms-transition": "all " + duration + "s", //0.25s
        "-webkit-transition": "all " + duration + "s", //0.25s
        "-moz-transition": "all " + duration + "s", //0.25s
        "transition": "all " + duration + "s", //0.25s
    }

    var genieAnimation = {
        "transform": "scale(0) perspective(370px) rotateX(45deg)"
    };

    var targetHeight = $target.height(),
        targetWidth = $target.width(),
        targetOffset = $target.offset(),
        sourceOffset = $source.offset(),
        //This is absolute; must check if item is left / right of the other
        diffX = sourceOffset.left - targetOffset.left - targetWidth*0.5,
        diffY = sourceOffset.top - targetOffset.top - targetHeight*0.5,
        origin = -diffX + 'px' + -diffY + 'px';
    
    console.log("[Genie Effect] origin is: ", origin);

    $source.css(genieEffect);
    $source.css({
        transformOrigin: origin
    });
    // $source.toggleClass("toggle-genie");
    $source.css(genieAnimation);
    return Promise.delay(delayTime);
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
    return Promise.delay(delayTime);
};


module.exports = {
    geniefy: effect,
    geniefy2: effect2 
}
