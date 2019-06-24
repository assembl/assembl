import React from 'react';
import renderer from 'react-test-renderer';

import ModuleBlock from '../../../../../js/app/components/administration/landingPage/moduleBlock';

describe('ModuleBlock component', () => {
  it('should render a block that represents the module', () => {
    const props = {
      type: 'HEADER',
      required: true,
      title: 'Header'
    };
    const component = renderer.create(<ModuleBlock {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a block that represents the module with move up/down arrows', () => {
    const moveDownSpy = jest.fn(() => {});
    const moveUpSpy = jest.fn(() => {});
    const props = {
      type: 'INTRODUCTION',
      moveDown: moveDownSpy,
      moveUp: moveUpSpy,
      title: 'Introduction',
      withArrows: true
    };
    const component = renderer.create(<ModuleBlock {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a block that represents the module with delete icon', () => {
    const props = {
      type: 'INTRODUCTION',
      title: 'Introduction',
      withArrows: false,
      remove: () => 1 + 1
    };
    const component = renderer.create(<ModuleBlock {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a block that represents the module with edit icon', () => {
    const props = {
      type: 'INTRODUCTION',
      title: 'Introduction',
      withArrows: false,
      edit: () => 1 + 1
    };
    const component = renderer.create(<ModuleBlock {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});