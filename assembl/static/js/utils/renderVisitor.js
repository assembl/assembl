define([],function(){

  function renderVisitor(data_by_idea, roots, filter_function) {
    if (filter_function === undefined) {
        filter_function = function(node) {return true;};
    }

    var last_parent_id = null;
    var last_idea_id = null;
    return function(idea, ancestry) {
        var filter_result = filter_function(idea);
        if (filter_result) {
            var idea_id = idea.getId();
            var level = 0;
            var in_ancestry = true;
            var ancestor_id, last_ancestor_id = null;
            var last_sibling_chain = [];
            for (var i in ancestry) {
                ancestor_id = ancestry[i].getId();
                in_ancestry = data_by_idea.hasOwnProperty(ancestor_id);
                if (in_ancestry) {
                    level++;
                    // this only works if we go breadth-first
                    // otherwise if the next sibling is filtered out, my parent's
                    // idea of is_last_sibling will be wrong
                    last_sibling_chain.push(data_by_idea[ancestor_id]['is_last_sibling']);
                    last_ancestor_id = ancestor_id;
                }
            }
            if (last_ancestor_id != null) {
                data_by_idea[last_ancestor_id]['children'].push(idea);
                if (last_ancestor_id == last_parent_id) {
                    data_by_idea[last_idea_id]['is_last_sibling'] = false;
                }
            } else {
                roots.push(idea);
            }
            last_parent_id = last_ancestor_id;
            var data = {
                '@id': idea_id,
                'idea': idea,
                'level': level,
                'skip_parent': !in_ancestry,
                'is_last_sibling': true,
                'last_sibling_chain': last_sibling_chain,
                'children': []
            };
            data_by_idea[idea_id] = data;
            last_idea_id = idea_id;
        }
        // This allows you to return 0 vs false and cut recursion short.
        return filter_result !== 0;
    };
  }

  return renderVisitor;

})