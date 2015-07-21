'use strict';

var Visitor = require("./visitor.js");

/** A visitor function to be passed to to a visit function such as
* Idea.visitBreadthFirst or MessageCollection.visitDepthFirst
*
* @param data_by_object: output param, dict containing for each object traversed the
*    render information indexed by the object id.  See the data variable inside
*    the function body for definition of the structure
* @param order_lookup_table output param, a list containing every object id retained
* indexed by traversal order
* @param roots: output param. The objects that have no parents in the set
* @param filter_function:  The object is passed to this callback.  If it returns:
*  - false the object won't be part of the returned set.
*  - 0 instead of false, all descendants of the object will also be excluded
*/
var ObjectTreeRenderVisitor = function(data_by_object, order_lookup_table, roots, filter_function) {
  this.data_by_object = data_by_object;
  this.order_lookup_table = order_lookup_table;
  this.roots = roots;
  if (filter_function === undefined) {
    filter_function = function (node) {
      return true;
    };
  }
  this.filter_function = filter_function;
};

ObjectTreeRenderVisitor.prototype = new Visitor();

ObjectTreeRenderVisitor.prototype.visit = function (object, ancestry) {
  var data_by_object = this.data_by_object,
      order_lookup_table = this.order_lookup_table,
      filter_result = this.filter_function(object);
  if (filter_result) {
    var object_id = object.getId();
    var level = 0;
    var in_ancestry = true;
    var ancestor_id, last_ancestor_id = null;
    var true_sibling = true;
    var real_ancestor_authors_list = [];
    var filtered_ancestor_authors_list = [];

    for (var i in ancestry) {
      var ancestor_id = ancestry[i];
      var ancestor = object.collection.get(ancestor_id);
      if (!ancestor) {
        // in synthesis, not all ancestors present
        continue;
      }
      var authors = []
      if(ancestor.get('idCreator')) {
        authors = [ancestor.get('idCreator')];
      }
      in_ancestry = data_by_object.hasOwnProperty(ancestor_id);
      real_ancestor_authors_list = _.union(real_ancestor_authors_list, authors);
      if (in_ancestry) {
        filtered_ancestor_authors_list  = _.union(filtered_ancestor_authors_list, authors);
        level++;
        last_ancestor_id = ancestor_id;
      }
    }
    if (last_ancestor_id != null) {
      var brothers = data_by_object[last_ancestor_id]['children'];
      if (brothers.length > 0) {
        var last_brother = brothers[brothers.length - 1];
        true_sibling = last_brother.get('parentId') == object.get('parentId');
        data_by_object[last_brother.getId()]['is_last_sibling'] = false;
      }
      brothers.push(object);
    } else {
      this.roots.push(object);
    }
    var data = {
        '@id': object_id,
        'object': object,
        'level': level,
        'real_ancestor_count': ancestry.length,
        'skip_parent': level != 0 & !in_ancestry,
        'is_last_sibling': true,
        'true_sibling': true_sibling,
        'children': [],
        'last_ancestor_id': last_ancestor_id,
        'traversal_order': order_lookup_table.length,
        real_ancestor_authors_list: real_ancestor_authors_list,
        filtered_ancestor_authors_list: filtered_ancestor_authors_list
    };
    data_by_object[object_id] = data;
    order_lookup_table.push(object_id);
  }
  // This allows you to return 0 vs false and cut recursion short.
  //benoitg:  map, this has no effect anymore right?
  return filter_result !== 0;
};

ObjectTreeRenderVisitor.prototype.post_visit = function(object, children_data) {
  //console.log(object, children_data);
  var filtered_descendant_count = 0,
      real_descendant_count = 0,
      filtered_descendant_authors_list = [],
      real_descendant_authors_list = [],
      filter_result = false,
      authors = [],
      retval = {};
  _.each(children_data, function(child_data) {
    if(child_data !== undefined) {
      filtered_descendant_count += child_data.filtered_descendant_count;
      real_descendant_count += child_data.real_descendant_count;
      filtered_descendant_authors_list = _.union(filtered_descendant_authors_list, child_data.filtered_descendant_authors_list);
      real_descendant_authors_list = _.union(real_descendant_authors_list, child_data.real_descendant_authors_list);
    }
  });
  //console.log(descendant_count);
  //console.log(this.data_by_object, object);
  if(object) {
    filter_result = this.filter_function(object);
    if(this.data_by_object[object.id]) {
      //If the object wasn't in filter, it won't be in the data_by_object table
      this.data_by_object[object.id].filtered_descendant_count = filtered_descendant_count;
      this.data_by_object[object.id].real_descendant_count = real_descendant_count;
      this.data_by_object[object.id].filtered_descendant_authors_list = filtered_descendant_authors_list;
      this.data_by_object[object.id].real_descendant_authors_list = real_descendant_authors_list;
    }
    if(object.get('idCreator')) {
      authors = [object.get('idCreator')];
    }
  }
  
  if (filter_result) {
    retval.filtered_descendant_count = filtered_descendant_count + 1;
    retval.filtered_descendant_authors_list = _.union(filtered_descendant_authors_list, authors);
  }
  else {
    retval.filtered_descendant_count = filtered_descendant_count;
    retval.filtered_descendant_authors_list = filtered_descendant_authors_list;
  }
  retval.real_descendant_count = real_descendant_count + 1;
  retval.real_descendant_authors_list = _.union(real_descendant_authors_list, authors);
  return retval;
};

module.exports = ObjectTreeRenderVisitor;