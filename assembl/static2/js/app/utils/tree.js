// @flow

export const getChildren = (rootNode: Object, nodes: Array<Object>): Array<Object> => {
  return nodes.filter((node) => {
    return node.ancestors.indexOf(rootNode.id) >= 0;
  });
};

export const getTree = (nodes: Array<Object>): Object => {
  let ids = nodes.map((node) => {
    return node.id;
  });
  const roots = nodes.filter((node) => {
    return (
      node.ancestors.filter((a) => {
        return ids.indexOf(a) >= 0;
      }).length === 0
    );
  });
  ids = roots.map((node) => {
    return node.id;
  });
  const children = nodes.filter((node) => {
    return ids.indexOf(node.id) < 0;
  });
  return {
    roots: roots,
    children: children
  };
};