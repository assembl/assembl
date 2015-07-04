'use strict';

var Visitor = function() {};

Visitor.prototype.visit = function(idea, ancestry) {
    return true;
};

Visitor.prototype.post_visit = function(idea, children_data) {
    return undefined;
};

module.exports = Visitor;