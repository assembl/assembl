'use strict';

var Visitor = require("./visitor.js");

/** This visitor will find the first idea with extracts, and/or the first idea altogether.
*/
var FirstIdeaToShowVisitor = function(extractsCollection) {
  this.extractsCollection = extractsCollection;
};

FirstIdeaToShowVisitor.prototype = new Visitor();

FirstIdeaToShowVisitor.prototype.visit = function (object) {
  if (this.ideaWithExtract !== undefined) {
    return false;
  }
  if (this.extractsCollection.where({idIdea: object.getId(), important: true }).length > 0) {
    this.ideaWithExtract = object;
    return false;
  }
  if (this.firstIdea === undefined && !object.isRootIdea()) {
    this.firstIdea = object;
  }
  return true;
};

module.exports = FirstIdeaToShowVisitor;
