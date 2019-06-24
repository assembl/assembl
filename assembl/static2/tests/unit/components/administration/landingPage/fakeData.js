// @flow
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

export const modulesById = Map({
  abc123: abc123,
  def456: def456,
  ghi789: ghi789,
  jkl865: jkl865
});

export const moduleTypes: Array<LandingPageModuleType> = [
  {
    id: '1',
    defaultOrder: 1,
    editableOrder: false,
    moduleId: 'abc123',
    identifier: 'HEADER',
    title: 'Header',
    required: true
  },
  {
    id: '2',
    defaultOrder: 2,
    editableOrder: true,
    moduleId: 'def456',
    identifier: 'INTRODUCTION',
    title: 'Introduction',
    required: false
  },
  {
    id: '3',
    defaultOrder: 3,
    editableOrder: true,
    moduleId: 'ghi789',
    identifier: 'VIDEO',
    title: 'Video',
    required: false
  },
  {
    id: '4',
    defaultOrder: 9,
    editableOrder: false,
    moduleId: 'jkl865',
    identifier: 'FOOTER',
    title: 'Footer',
    required: true
  }
];

export const enabledModules = List.of(abc123, ghi789, jkl865);