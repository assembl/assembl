define([],function(){
  /** A visitor function to be passed to to a visit function such as 
   * Idea.visitBreadthFirst<
   * data_by_idea: output param, dict containing for each idea traversed the 
   *    render information indexted by the idea id.
   * roots: output param. The ideas that have no parents in the set
   * filter_function:  The idea is passed to this callback.  If it returns:
   *  - false the idea won't be part of the returned set.
   *  - 0 instead of false, all descendents of the idea will also be excluded
   */
  function siblingChainVisitor(data_by_idea) {
    return function(idea, ancestry) {
        var idea_id = idea.getId();
        if (data_by_idea.hasOwnProperty(idea_id)) {
            var level = 0;
            var in_ancestry = true;
            var ancestor_id, last_ancestor_id = null;
            var last_sibling_chain = [];
            for (var i in ancestry) {
                ancestor_id = ancestry[i].getId();
                if (data_by_idea.hasOwnProperty(ancestor_id)) {
                    last_sibling_chain.push(data_by_idea[ancestor_id]['is_last_sibling']);
                }
            }
            data_by_idea[idea_id]['last_sibling_chain'] = last_sibling_chain;
        }
        return true;
    };
  }
  return siblingChainVisitor;
})