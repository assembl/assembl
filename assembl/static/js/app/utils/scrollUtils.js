'use strict';
/**
 * 
 * @module app.utils.scrollUtils
 */

var jQuery = require('jquery'),
    Raven = require('raven-js');

var debugScrollUtils = false;

/** 
 * How often the position of watched element should be checked.
 * (Each ScrollWatchInterval milliseconds)
 */
var ScrollWatchInterval = 2000;

/**
 * How long, in milliseconds, can a scroll watch process last untill unconditionally suiciding.
 */
var maxWatchProcessDuration = 15000;

/**
 * Taken from
 * https://github.com/slindberg/jquery-scrollparent/blob/master/jquery.scrollparent.js
 */
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
 * Utility method. Tell you how many pixels from the top of the viewport the el
 * is.
 */
var getElementViewportOffset = function(el, scrollableViewport) {
  var scrollableViewportWindowOffset = scrollableViewport.offset().top,
  elWindowOffset = el.offset().top,
  elViewPortOffset = elWindowOffset - scrollableViewportWindowOffset;

  if(debugScrollUtils) {
    console.log("scrollUtils::getElementViewportOffset(): scrollableViewportWindowOffset: ",scrollableViewportWindowOffset, "elWindowOffset: ", elWindowOffset, el.offset(), el, "elViewPortOffset: ", elViewPortOffset);
  }
  if(el.offset().top === 0 && el.offset().left === 0) {
    throw new Error("el has a good probability to be in an invalid state. This seems to happen after a failed scrollTop on the parent scrollable, among other conditions");
  }
  return elViewPortOffset;
}

/**
 * Utility method. Computes where to scroll to get the top of el 
 * desiredViewportOffset pixels from the top of the viewport.
 */
var computeScrollTarget = function(el, scrollableViewport, desiredViewportOffset) {
  var scrollableViewportScrollTop = scrollableViewport.scrollTop(),
  elViewPortOffset = getElementViewportOffset(el, scrollableViewport),
  scrollTarget = elViewPortOffset + scrollableViewportScrollTop - desiredViewportOffset;
  if(debugScrollUtils) {
    console.log("scrollUtils::computeScrollTarget(): scrollableViewport info:", " scrollHeight: ", scrollableViewport[0].scrollHeight, ", height: ", scrollableViewport.height()," scrollableViewportScrollTop: ", scrollableViewportScrollTop," el info: ", "elViewPortOffset: ", elViewPortOffset, "computed scrollTarget:",scrollTarget);
  }
  return scrollTarget;
};
 var scrollToNextPanel = function(elm,delay,xValue){
  var selector = elm;
  setTimeout(function(){
    $(selector).animate({scrollLeft:xValue}, 500);
  },delay);//Delay because sometimes there is an action before.
};
/**
 * scrolls to any dom element in the messageList. Unlike scrollToMessage, the
 * element must already be onscreen. This is also called by views/message.js
 * 
 * @param callback:
 *          will be called once animation is complete
 * @param margin:
 *          How much to scroll up or down from the top of the element. Default
 *          is 30px for historical reasons
 * @param animate:
 *          Should the scroll be smooth
 *          
 * @param watch: Should a watchtdog check that the scrool doesn't move in case 
 * of progressive loading, etc.  Default is no.
 */
var scrollToElement = function(el, callback, margin, animate, watch) {
  if(debugScrollUtils) {
    console.log("scrollUtils::scrollToElement() called with: ", el, callback, margin, animate, watch);
  }
  var scrollableElement = el.scrollParent();
  //console.log("scrollableElement: ", scrollableElement);
  if (!scrollableElement) {
    throw new Exception("scrollToElement: Unable to find a scrollable element.");
  }
  if (!el) {
    console.warn("scrollUtils::scrollToElement(): Warning: element to scroll to not found, aborting");
    return;
    }
  if(!_.isFunction(scrollableElement.size)) {
    console.warn("scrollUtils::scrollToElement(): Warning: scrollableElement has no size, aborting");
    return;
  } 
  if(scrollableElement.offset() === undefined) {
    console.warn("scrollUtils::scrollToElement(): Warning: scrollableElement has no offset (hidden?), aborting");
    if(debugScrollUtils) {
      console.log("scrollUtils::scrollToElement(): el: ", el, "scrollableElement: ", scrollableElement);
    }
    return;
  }
  
  var scrollTarget,
  desiredViewportOffset = margin || 30;

  if (animate === undefined) {
    animate = true;
  }

  scrollTarget = computeScrollTarget(el, scrollableElement, desiredViewportOffset);

  if(debugScrollUtils) {
    console.log("scrollUtils::scrollToElement(): initialized on ",el, "desiredViewportOffset:", desiredViewportOffset, "scrollTarget:", scrollTarget);
  }
  var elReference = el;
  var processCallback = function() {
    try {
      var finalViewportOffset = getElementViewportOffset(elReference, scrollableElement),
      differenceToTargetOffset = finalViewportOffset - desiredViewportOffset;
      if(debugScrollUtils) {
        console.log("scrollUtils::scrollToElement(): Final viewPort offset: ", finalViewportOffset, ", difference of: ", differenceToTargetOffset, " with desiredViewportOffset of ", desiredViewportOffset);
      }
      if (animate && differenceToTargetOffset !== 0) {
        if(debugScrollUtils) {
          console.log("scrollUtils::scrollToElement(): differenceToTargetOffset is not 0.  The content above the element may well have changed length during animation, retry scrolling with no animation");
        }


        var scrollTarget = computeScrollTarget(elReference, scrollableElement, desiredViewportOffset);
        scrollableElement.scrollTop(scrollTarget);
        if(debugScrollUtils) {
          console.log("scrollUtils::scrollToElement(): POST_RETRY Final viewPort offset: ", getElementViewportOffset(el, scrollableElement), ", difference to target offset: ", getElementViewportOffset(el, scrollableElement) - desiredViewportOffset, " target scrollTop was ", scrollTarget, "final scrollTop is ", scrollableElement.scrollTop());
        }


      }
      if (_.isFunction(callback)) {
        callback();
      }
      if(watch) {
        _watchOffset(el, scrollableElement);
      }
    }
    catch (e) {
      if (sentry_dsn) {
        Raven.captureException(e);
      } else {
        throw e;
      }
    }
  }

  if (animate) {
    scrollableElement.animate({ scrollTop: scrollTarget }, { always: processCallback, duration: 800 });
  }
  else {
    scrollableElement.scrollTop(scrollTarget);
    processCallback();
  }
};

//TODO:  Detect and cancel any OTHER watch offset on the same scrollable element
//TODO:  Allow retrying initial scroll for a certain amount of time?
//TODO:  Clean handling when the scrool would scrool below the bottom of the viewport.
//TODO:  Handle cleanly the element disapearing from DOM

var _watchOffset = function(el, scrollableViewport, initialWatchProcessTimestampParam) {
  var initialScrollableViewportHeight = scrollableViewport[0].scrollHeight,
  initialElViewPortOffset = getElementViewportOffset(el, scrollableViewport),
  initialWatchProcessTimestamp = initialWatchProcessTimestampParam;
  
  if (initialWatchProcessTimestamp === undefined) {
    //console.log("Setting initialWatchProcessTimestamp");
    initialWatchProcessTimestamp = Date.now(); // unix timestamp in milliseconds;
  }

  if(debugScrollUtils) {
    console.log("scrollUtils::_watchOffset: initialized with initialScrollableViewportHeight:", initialScrollableViewportHeight, ", initialElViewPortOffset: ", initialElViewPortOffset);
  }

  var watcherId = null;
  var _watchSuicide = function() {
    if(debugScrollUtils) {
      console.log("scrollUtils::_watchSuicide: Killing handlers");
    }
    scrollableViewport.off("scroll", _throttledWatchScrollHandler );
    clearTimeout(watcherId);
  }
  var _watchScrollHandler = function(ev) {
    if(debugScrollUtils) {
      console.log("scrollUtils::_watchScrollHandler fired with", ev);
    }
    var newElViewPortOffset = getElementViewportOffset(el, scrollableViewport);
    if(newElViewPortOffset === initialElViewPortOffset) {

      if(debugScrollUtils) {
        console.log("scrollUtils::_watchScrollHandler: We are at initialElViewPortOffset, we probably just caught our own scrollEvent, ignoring.");
      }
      return;
    }
    else {
      if(debugScrollUtils) {
        console.log("scrollUtils::_watchScrollHandler: We are NOT at initialElViewPortOffset, we just caught a user or script scroll.  Suiciding. currentElViewPortOffset:", newElViewPortOffset);
        
      }
      _watchSuicide();
    }
  }

  var _throttledWatchScrollHandler = _.throttle(_watchScrollHandler, 100);
  scrollableViewport.on("scroll", _throttledWatchScrollHandler );

  var _watchProcess = function() {
    var currentScrollableViewportHeight = scrollableViewport[0].scrollHeight,
    currentElViewPortOffset = getElementViewportOffset(el, scrollableViewport),
    scrollableViewportHeightChange = currentScrollableViewportHeight - initialScrollableViewportHeight,
    elViewPortOffsetChange = currentElViewPortOffset - initialElViewPortOffset;
    //  TODO:  Check if the actual element changed height (could be a signal that it just finished loading)

    scrollableViewport.off("scroll", _throttledWatchScrollHandler );

    //console.log("currentElViewPortOffset", currentElViewPortOffset, "initialElViewPortOffset",initialElViewPortOffset, "scrollableViewportHeightChange:", elViewPortOffsetChange, "elViewPortOffsetChange: ", elViewPortOffsetChange);

    var newWatchCallback = function () {
      var newElViewPortOffset = getElementViewportOffset(el, scrollableViewport);

      if(newElViewPortOffset !== initialElViewPortOffset) {
        if(debugScrollUtils) {
          console.warn("scrollUtils::_watchProcess: I was unable to scroll to initialOffset, this shouldn't normally happen.  Cowardly aborting watch.");
        }
      }
      else {
        _watchOffset(el, scrollableViewport, initialWatchProcessTimestamp);
      }
    }

    var unixTimestamp = Date.now(); // in milliseconds

    if(debugScrollUtils) {
      console.log("scrollUtils::_watchProcess: unixTimestamp - initialWatchProcessTimestamp: ", unixTimestamp - initialWatchProcessTimestamp);
    }

    if(unixTimestamp - initialWatchProcessTimestamp > maxWatchProcessDuration) {
      if(debugScrollUtils) {
        console.log("scrollUtils::_watchProcess: maxWatchProcessDuration duration exceeded, stopping watch");
      }
    }
    else if(elViewPortOffsetChange === 0) {
      if(debugScrollUtils) {
        console.log("scrollUtils::_watchProcess: Everything is fine, same position in viewport, continuing to watch");
      }
      newWatchCallback();
    }
    else if (scrollableViewportHeightChange !== 0){
      if(debugScrollUtils) {
        console.log("scrollUtils::_watchProcess: Position in viewport changed, and size of content in viewport also changed, readjusting");
      }
      scrollToElement(el, newWatchCallback, initialElViewPortOffset);
    }
    else {
      if(debugScrollUtils) {
        console.warn("scrollUtils::_watchProcess: Position in viewport changed, but size of viewport did NOT change (undetected user or JS initiated scrool?).  Cowardly aborting watch.");
      }
      //scrollToElement(el, newWatchCallback, initialElViewPortOffset);
    }
  }
  watcherId = setTimeout(_watchProcess, ScrollWatchInterval);
}

var scrollToElementAndWatch = function(el, callback, margin, animate) {
  scrollToElement(el, callback, margin, animate, true);
};

var maintainScroll = function(elementJquerySelector) {

}

module.exports = {
    scrollToElementAndWatch: scrollToElementAndWatch,
    maintainScroll: maintainScroll,
    scrollToElement: scrollToElement,
    scrollToNextPanel:scrollToNextPanel
};
