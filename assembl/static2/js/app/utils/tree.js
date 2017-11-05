// @flow

type NodeType = {
  id: string,
  ancestors: Array<string>
};

/**
 * @param {Object} The root node.
 * @param {Array} An array of nodes.
 * @returns {String} Returns the direct child nodes of the root.
 */
export const getChildren = (rootNode: NodeType, nodes: Array<NodeType>): Array<NodeType> => {
  return nodes.filter((node) => {
    return node.ancestors.includes(rootNode.id);
  });
};

/**
 * @param {Array} An array of nodes.
 * @returns {Object} Returns the partial tree composed of all the root nodes and their children.
 */
export const getPartialTree = (nodes: Array<NodeType>): Object => {
  let ids = nodes.map((node) => {
    return node.id;
  });
  const roots = nodes.filter((node) => {
    return node.ancestors.every((a) => {
      return !ids.includes(a);
    });
  });
  ids = roots.map((node) => {
    return node.id;
  });
  const children = nodes.filter((node) => {
    return !ids.includes(node.id);
  });
  return {
    roots: roots,
    children: children
  };
};