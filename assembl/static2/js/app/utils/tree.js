// @flow

export const getChildren = (rootNode: Object, nodes: Array<Object>): Array<Object> => {
  return nodes.filter((node) => {
    return node.ancestors.includes(rootNode.id);
  });
};

export const getPartialTree = (nodes: Array<Object>): Object => {
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