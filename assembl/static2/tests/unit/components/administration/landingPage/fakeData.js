import { List, Map } from 'immutable';

const HEADER = Map({
  enabled: true,
  moduleType: Map({
    identifier: 'HEADER',
    title: 'Header'
  }),
  order: 1.0
});

const INTRODUCTION = Map({
  enabled: false,
  moduleType: Map({
    identifier: 'INTRODUCTION',
    title: 'Introduction'
  }),
  order: 2.0
});

const VIDEO = Map({
  enabled: true,
  moduleType: Map({
    identifier: 'VIDEO',
    title: 'Video'
  }),
  order: 5.0
});

const FOOTER = Map({
  enabled: true,
  moduleType: Map({
    identifier: 'FOOTER',
    title: 'Footer'
  }),
  order: 99.0
});

export const modulesByIdentifier = Map({
  HEADER: HEADER,
  INTRODUCTION: INTRODUCTION,
  VIDEO: VIDEO,
  FOOTER: FOOTER
});

export const modulesTypes = [
  {
    identifier: 'HEADER',
    title: 'Header',
    required: true
  },
  {
    identifier: 'INTRODUCTION',
    title: 'Introduction',
    required: false
  },
  {
    identifier: 'VIDEO',
    title: 'Video',
    required: false
  },
  {
    identifier: 'FOOTER',
    title: 'Footer',
    required: true
  }
];

export const enabledModulesInOrder = List.of(HEADER, VIDEO, FOOTER);