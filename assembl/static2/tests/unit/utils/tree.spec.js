import sortBy from 'lodash/sortBy';

import {
  getChildren,
  getPartialTree,
  getPartialTreeByParentId,
  getTree,
  getAncestors,
  getPath
} from '../../../js/app/utils/tree';

describe('Tree', () => {
  describe('Children getter', () => {
    it('should return the bar node', () => {
      const rootNode = { id: 'foo', ancestors: [] };
      const nodes = [{ id: 'foo', ancestors: [] }, { id: 'bar', ancestors: ['foo'] }, { id: 'tar', ancestors: ['bar'] }];
      const children = getChildren(rootNode, nodes);
      expect(children.length).toEqual(1);
      expect(children[0].id).toEqual('bar');
    });
  });
  describe('Partial tree', () => {
    it('should return the partial tree', () => {
      const nodes = [{ id: 'foo', ancestors: [] }, { id: 'bar', ancestors: ['foo'] }, { id: 'tar', ancestors: ['bar'] }];
      const tree = getPartialTree(nodes);
      const roots = tree.roots;
      const descendants = tree.descendants;
      expect(roots.length).toEqual(1);
      expect(roots[0].id).toEqual('foo');
      expect(descendants.length).toEqual(2);
      const ids = descendants.map(c => c.id);
      const expected = ['bar', 'tar'];
      expect(ids).toEqual(expect.arrayContaining(expected));
    });
  });
  describe('Partial tree by parentId', () => {
    it('should return the partial tree', () => {
      const nodes = [{ id: 'foo', parentId: 'root' }, { id: 'bar', parentId: 'foo' }, { id: 'tar', parentId: 'bar' }];
      const tree = getPartialTreeByParentId('root', nodes);
      const roots = tree.roots;
      const descendants = tree.descendants;
      expect(roots.length).toEqual(1);
      expect(roots[0].id).toEqual('foo');
      expect(descendants.length).toEqual(2);
      const ids = descendants.map(c => c.id);
      const expected = ['bar', 'tar'];
      expect(ids).toEqual(expect.arrayContaining(expected));
    });
  });

  describe('Get Tree', () => {
    it('should return the tree', () => {
      const nodes = [
        { id: 'foo', parentId: 'root' },
        { id: 'bar', parentId: 'foo' },
        { id: 'tar', parentId: 'bar' },
        { id: 'lar', parentId: 'foo' }
      ];
      const tree = getTree('root', nodes);
      expect(tree.length).toEqual(1);
      expect(tree[0].id).toEqual('foo');
      expect(tree[0].children.length).toEqual(2);
      const ids = tree[0].children.map(c => c.id);
      const expected = ['bar', 'lar'];
      expect(ids).toEqual(expect.arrayContaining(expected));
      const bar = tree[0].children.find(c => c.id === 'bar');
      expect(bar.children.length).toEqual(1);
      expect('tar').toEqual(bar.children[0].id);
    });
  });

  describe('Get ancestors', () => {
    it('should return ancestors', () => {
      const nodes = [
        { id: 'foo', parentId: 'root' },
        { id: 'bar', parentId: 'foo' },
        { id: 'tar', parentId: 'bar' },
        { id: 'lar', parentId: 'foo' }
      ];
      let ancestors = getAncestors({ id: 'tar', parentId: 'bar' }, nodes);
      expect(ancestors.length).toEqual(2);
      const expected = ['bar', 'foo'];
      expect(ancestors.map(i => i.id)).toEqual(expect.arrayContaining(expected));
      ancestors = getAncestors({ id: 'lar', parentId: 'foo' }, nodes);
      expect(ancestors.length).toEqual(1);
      expect(ancestors[0].id).toEqual('foo');
    });
  });

  describe('Get item path', () => {
    it('should return the path of an item in a tree', () => {
      const nodes = [
        { id: 'foo', parentId: 'root' },
        { id: 'bar', parentId: 'foo' },
        { id: 'tar', parentId: 'bar' },
        { id: 'lar', parentId: 'foo' }
      ];
      const sortItems = items => sortBy(items, 'id');
      let path = getPath({ id: 'tar', parentId: 'bar' }, sortItems(nodes));
      let expected = [0, 0, 0];
      expect(path).toEqual(expect.arrayContaining(expected));
      path = getPath({ id: 'lar', parentId: 'foo' }, sortItems(nodes));
      expected = [0, 1];
      expect(path).toEqual(expect.arrayContaining(expected));
    });
  });
});