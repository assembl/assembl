// @flow

type NodeType = {
  id: string,
  ancestors: Array<string>
};

type TreeNodeType = {
  id: string,
  parentId: string
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
  return nodes.filter(node => node.ancestors && node.ancestors.includes(rootNode.id));
}

/**
 * @param {T: NodeType} The type of the nodes
 * @param {Array<T>} An array of nodes.
 * @returns {{roots: Array<T>, descendants: Array<T>}} Returns the partial tree composed of all the root nodes and their children.
 */
export function getPartialTree<T: NodeType>(nodes: Array<T>): TreeType<T> {
  let ids = nodes.map(node => node.id);
  const roots = nodes.filter(node => !node.ancestors || node.ancestors.every(a => !ids.includes(a)));
  ids = roots.map(node => node.id);
  const descendants = nodes.filter(node => !ids.includes(node.id));
  return {
    roots: roots,
    descendants: descendants
  };
}

/**
 * @param {T: TreeNodeType} The type of the nodes
 * @param {Array<T>} An array of nodes.
 * @returns {{roots: Array<T>, descendants: Array<T>}} Returns the partial tree composed of all the root nodes and their children.
 */
export function getPartialTreeByParentId<T: TreeNodeType>(rootId: string, nodes: Array<T>): TreeType<T> {
  const result = {
    roots: [],
    descendants: []
  };
  if (nodes.length === 0) return result;
  const roots = rootId ? nodes.filter(item => !item.parentId || item.parentId === rootId) : nodes;
  if (roots.length === 0) return result;
  result.roots = roots;
  const rootsIds = roots.map(item => item.id);
  result.descendants = nodes.filter(item => !rootsIds.includes(item.id));
  return result;
}

/**
 * @param {T: TreeNodeType} The type of the nodes
 * @param {Array<T>} An array of nodes.
 * @returns {Array<T>} Returns the tree composed of all the root nodes and their children.
 */
export function getTree<T: TreeNodeType>(rootId: string, nodes: Array<T>, childrenName: string = 'children'): Array<T> {
  const { roots, descendants } = getPartialTreeByParentId(rootId, nodes);
  if (roots.length === 0) return [];
  return roots.map(item => ({ ...item, [childrenName]: getTree(item.id, descendants, childrenName) }));
}