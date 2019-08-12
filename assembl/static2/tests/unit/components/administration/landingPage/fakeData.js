import { List, Map } from 'immutable';

const abc123 = Map({
  enabled: true,
  id: 'abc123',
  moduleType: Map({
    moduleId: 'abc123',
    editableOrder: false,
    identifier: 'HEADER',
    required: true,
    title: 'Header'
  }),
  order: 1.0
});

const def456 = Map({
  enabled: false,
  id: 'def456',
  moduleType: Map({
    moduleId: 'def456',
    editableOrder: true,
    identifier: 'INTRODUCTION',
    title: 'Introduction'
  }),
  order: 2.0
});

const ghi789 = Map({
  enabled: true,
  id: 'ghi789',
  moduleType: Map({
    moduleId: 'ghi789',
    editableOrder: true,
    identifier: 'VIDEO',
    title: 'Video'
  }),
  order: 5.0
});

const jkl865 = Map({
  enabled: true,
  id: 'jkl865',
  moduleType: Map({
    moduleId: 'jkl865',
    editableOrder: false,
    identifier: 'FOOTER',
    required: true,
    title: 'Footer'
  }),
  order: 99.0
});

export const modulesByIdData = Map({
  abc123: abc123,
  def456: def456,
  ghi789: ghi789,
  jkl865: jkl865
});

export const moduleTypes = [
  {
    moduleId: 'abc123',
    identifier: 'HEADER',
    title: 'Header',
    required: true
  },
  {
    moduleId: 'def456',
    identifier: 'INTRODUCTION',
    title: 'Introduction',
    required: false
  },
  {
    moduleId: 'ghi789',
    identifier: 'VIDEO',
    title: 'Video',
    required: false
  },
  {
    moduleId: 'jkl865',
    identifier: 'FOOTER',
    title: 'Footer',
    required: true
  }
];

export const enabledModules = List.of(abc123, ghi789, jkl865);