define([],function(){
  /** A visitor function to be passed to to a visit function such as 
   * Idea.visitBreadthFirst or MessageCollection.visitDepthFirst
   * 
   * data_by_object: output param, dict containing for each object traversed the 
   *    render information indexed by the object id.  See the data variable inside
   *    the function body for definition of the structure
   * roots: output param. The objects that have no parents in the set
   * filter_function:  The object is passed to this callback.  If it returns:
   *  - false the object won't be part of the returned set.
   *  - 0 instead of false, all descendants of the object will also be excluded
   */
  function objectTreeRenderVisitor(data_by_object, roots, filter_function) {
    if (filter_function === undefined) {
        filter_function = function(node) {return true;};
    }

    return function(object, ancestry) {
        var filter_result = filter_function(object);
        if (filter_result) {
            var object_id = object.getId();
            var level = 0;
            var in_ancestry = true;
            var ancestor_id, last_ancestor_id = null;
            var true_sibling = true;
            for (var i in ancestry) {
                ancestor_id = ancestry[i].getId();
                in_ancestry = data_by_object.hasOwnProperty(ancestor_id);
                if (in_ancestry) {
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
                roots.push(object);
            }
            var data = {
                '@id': object_id,
                'object': object,
                'level': level,
                'skip_parent': level!=0 & !in_ancestry,
                'is_last_sibling': true,
                'true_sibling': true_sibling,
                'children': [],
                'last_ancestor_id': last_ancestor_id
            };
            data_by_object[object_id] = data;
        }
        // This allows you to return 0 vs false and cut recursion short.
        return filter_result !== 0;
    };
  }

  return objectTreeRenderVisitor;

})