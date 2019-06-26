import React from 'react';
import renderer from 'react-test-renderer';
import { Map } from 'immutable';

import ModuleBlock from '../../../../../js/app/components/administration/landingPage/moduleBlock';

describe('ModuleBlock component', () => {
  it('should render a block that represents the module', () => {
    const props = {
      module: new Map({
        enabled: true,
        moduleType: new Map({
          identifier: 'HEADER',
          title: 'Header',
          required: true,
          editableOrder: false
        })
      })
    };
    const component = renderer.create(<ModuleBlock {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a block that represents the module with move up/down arrows', () => {
    const moveDownSpy = jest.fn(() => {});
    const moveUpSpy = jest.fn(() => {});
    const props = {
      moveDown: moveDownSpy,
      moveUp: moveUpSpy,
      module: new Map({
        enabled: true,
        moduleType: new Map({
          identifier: 'INTRODUCTION',
          title: 'Introduction',
          required: true,
          editableOrder: true
        })
      })
    };
    const component = renderer.create(<ModuleBlock {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a block that represents the module with delete icon', () => {
    const props = {
      remove: () => 1 + 1,
      module: new Map({
        enabled: true,
        moduleType: new Map({
          identifier: 'INTRODUCTION',
          title: 'Introduction',
          required: false,
          editableOrder: false
        })
      })
    };
    const component = renderer.create(<ModuleBlock {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a block that represents the module with edit icon', () => {
    const props = {
      edit: () => 1 + 1,
      module: new Map({
        enabled: true,
        moduleType: new Map({
          identifier: 'INTRODUCTION',
          title: 'Introduction',
          required: true,
          editableOrder: false
        })
      })
    };
    const component = renderer.create(<ModuleBlock {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});