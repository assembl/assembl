// @flow

type NodeType = {
  id: string,
  ancestors: Array<string>
};

type TreeType<T> = {
  roots: Array<T>,
  descendants: Array<T>
};

/**
 * @param {T: NodeType} The type of the nodes
 * @param {T} The root node.
 * @param {Array<T>} An array of nodes.
 * @returns {Array<T>} Returns the direct child nodes of the root.
 */
export function getChildren<T: NodeType>(rootNode: T, nodes: Array<T>): Array<T> {
  return nodes.filter((node) => {
    return node.ancestors.includes(rootNode.id);
  });
}

/**
 * @param {T: NodeType} The type of the nodes
 * @param {Array<T>} An array of nodes.
 * @returns {{roots: Array<T>, descendants: Array<T>}} Returns the partial tree composed of all the root nodes and their children.
 */
export function getPartialTree<T: NodeType>(nodes: Array<T>): TreeType<T> {
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
  const descendants = nodes.filter((node) => {
    return !ids.includes(node.id);
  });
  return {
    roots: roots,
    descendants: descendants
  };
}