import { List, Map } from 'immutable';

const abc123 = Map({
  enabled: true,
  moduleType: Map({
    id: 'abc123',
    editableOrder: false,
    identifier: 'HEADER',
    required: true,
    title: 'Header'
  }),
  order: 1.0
});

const def456 = Map({
  enabled: false,
  moduleType: Map({
    id: 'def456',
    editableOrder: true,
    identifier: 'INTRODUCTION',
    title: 'Introduction'
  }),
  order: 2.0
});

const ghi789 = Map({
  enabled: true,
  moduleType: Map({
    id: 'ghi789',
    editableOrder: true,
    identifier: 'VIDEO',
    title: 'Video'
  }),
  order: 5.0
});

const jkl865 = Map({
  enabled: true,
  moduleType: Map({
    id: 'jkl865',
    editableOrder: false,
    identifier: 'FOOTER',
    required: true,
    title: 'Footer'
  }),
  order: 99.0
});

export const modulesById = Map({
  abc123: abc123,
  def456: def456,
  ghi789: ghi789,
  jkl865: jkl865
});

export const moduleTypes = [
  {
    id: 'abc123',
    identifier: 'HEADER',
    title: 'Header',
    required: true
  },
  {
    id: 'def456',
    identifier: 'INTRODUCTION',
    title: 'Introduction',
    required: false
  },
  {
    id: 'ghi789',
    identifier: 'VIDEO',
    title: 'Video',
    required: false
  },
  {
    id: 'jkl865',
    identifier: 'FOOTER',
    title: 'Footer',
    required: true
  }
];

export const enabledModulesInOrder = List.of(abc123, ghi789, jkl865);