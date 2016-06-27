'use strict';
/**
 * 
 * @module app.views.visitors.visitor
 */

var Visitor = function() {};

Visitor.prototype.visit = function(object, ancestry) {
  return true;
};

/**
 * @param object:  The object travested back up.  undefined if we are at the virtual root.
 * @param children_data [] of the result of post_visit for each children.  If undefined, it means nothing was visited
 * 
 */
Visitor.prototype.post_visit = function(object, children_data) {
  return undefined;
};

module.exports = Visitor;
