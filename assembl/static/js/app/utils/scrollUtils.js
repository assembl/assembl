'use strict';

var jQuery = require('../shims/jquery.js');

/** Taken from https://github.com/slindberg/jquery-scrollparent/blob/master/jquery.scrollparent.js */
jQuery.fn.scrollParent = function() {
  var overflowRegex = /(auto|scroll)/,
  position = this.css( "position" ),
  excludeStaticParent = position === "absolute",
  scrollParent = this.parents().filter( function() {
    var parent = $( this );
    if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
      return false;
    }
    return (overflowRegex).test( parent.css( "overflow" ) + parent.css( "overflow-y" ) + parent.css( "overflow-x" ) );
  }).eq( 0 );

  return position === "fixed" || !scrollParent.length ? $( this[ 0 ].ownerDocument || document ) : scrollParent;
};

/**
 * scrolls to any dom element in the messageList.
 * Unlike scrollToMessage, the element must already be onscreen.
 * This is also called by views/message.js
 *
 * @param callback:  will be called once animation is complete
 * @param margin:  How much to scroll up or down from the top of the
 * element.  Default is 30px for historical reasons
 * @param animate:  Should the scroll be smooth
 */
var scrollToElement = function(el, callback, margin, animate) {
  //console.log("scrollUtils::scrollToElement() called with: ", el, callback, margin, animate);
  var scrollableElement = $(el).scrollParent();
  //console.log("scrollableElement: ", scrollableElement);
  if (!scrollableElement) {
    throw new Exception("scrollToElement: Unable to find a scrollable element.");
  }

  if (el && _.isFunction(scrollableElement.size) && scrollableElement.offset() !== undefined) {
    var panelOffset = scrollableElement.offset().top,
    panelScrollTop = scrollableElement.scrollTop(),
    elOffset = el.offset().top,
    target;
    margin = margin || 30;
    if (animate === undefined) {
      animate = true;
    }

    target = elOffset - panelOffset + panelScrollTop - margin;

    //console.log(elOffset, panelOffset, panelScrollTop, margin, target);
    if (animate) {
      scrollableElement.animate({ scrollTop: target }, { complete: callback });
    }
    else {
      scrollableElement.scrollTop(target);
      if (_.isFunction(callback)) {
        callback();
      }
    }
  }
};

var scrollWatch = function() {

};

var maintainScroll = function(elementJquerySelector) {
  
}

module.exports = {
    scrollWatch: scrollWatch,
    maintainScroll: maintainScroll,
    scrollToElement: scrollToElement
  };