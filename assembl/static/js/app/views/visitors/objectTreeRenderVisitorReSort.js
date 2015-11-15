'use strict';

var Visitor = require("./visitor.js");

/**
* Traversal function to re-visit the output of an ObjectTreeRenderVisitor.
* @param visitor visitor function.  If visitor returns true, traversal continues
* @return {Object[]}
*/
function objectTreeRenderReVisitDepthFirst(data_by_object, visitor, sort_comparator_function, data, ancestry) {
  var data_sort_comparator_function = function(data) {
      return sort_comparator_function(data);
    };
  var object_sort_comparator_function = function(object) {
    return sort_comparator_function(data_by_object[object.id]);
  };
  if (ancestry === undefined) {
    ancestry = [];
  }

  if (data === undefined) {
    var rootData = _.where(data_by_object, { last_ancestor_id: null });

    //console.log("rootData", rootData);
    rootData = _.sortBy(rootData, data_sort_comparator_function);
    for (var i in rootData) {
      objectTreeRenderReVisitDepthFirst(data_by_object, visitor, sort_comparator_function, rootData[i], ancestry);
    }

    return;
  }

  if (visitor.visit(data)) {
    //Copy ancestry
    ancestry = ancestry.slice(0);
    ancestry.push(data);
    //console.log(data.children);
    var children = _.sortBy(data.children, object_sort_comparator_function);
    for (var i in children) {
      objectTreeRenderReVisitDepthFirst(data_by_object, visitor, sort_comparator_function, data_by_object[children[i].id], ancestry);
    }
  }
}

/** A visitor function to be passed to to a visit function such as
* Idea.visitBreadthFirst or MessageCollection.visitDepthFirst
*
* @param data_by_object_roots: output param, dict containing for each object traversed the
*    render information indexed by the object id.  See the data variable inside
*    the function body for definition of the structure
* @param order_lookup_table output param, a list containing every object id retained
* indexed by traversal order
* @param roots: output param. The objects that have no parents in the set
*/
function ObjectTreeRenderVisitorReSortVisitor(order_lookup_table, roots) {
  this.order_lookup_table = order_lookup_table;
  this.roots = roots;
}

ObjectTreeRenderVisitorReSortVisitor.prototype = new Visitor();

ObjectTreeRenderVisitorReSortVisitor.prototype.visit = function(data, ancestry) {
  //console.log("visited ", data['@id']);
  this.order_lookup_table.push(data['@id']);
  if (data.last_ancestor_id === null) {
    this.roots.push(data.object);
  }

  return true;
};

/** Re-sort the data_by_object of an ObjectTreeRenderVisitor, using a sibling sort
* function, and outputs the new order_lookup_table and the new (sorted) roots.
* @paramo rder_lookup_table output param, a list containing every object id retained
* indexed by traversal order
* @param roots: input/output param. The objects that have no parents in the
* set.  This list will be re-sorted
* @param sort_comparator_function:  The parse data (data_by_object[object.id] is passed to this callback.  ex:  sort_comparator_function(data)
*/
function objectTreeRenderVisitorReSort(data_by_object, order_lookup_table, roots, sort_comparator_function) {
  //console.log(data_by_object);
  if (sort_comparator_function === undefined) {
    throw new Error("There is no point in sorting without a comparator function.");
  }

  var visitor = new ObjectTreeRenderVisitorReSortVisitor(order_lookup_table, roots);
  objectTreeRenderReVisitDepthFirst(data_by_object, visitor, sort_comparator_function);
}

module.exports = objectTreeRenderVisitorReSort;
