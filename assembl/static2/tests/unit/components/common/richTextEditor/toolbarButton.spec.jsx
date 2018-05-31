import React from 'react';
import renderer from 'react-test-renderer';

import ToolbarButton from '../../../../../js/app/components/common/richTextEditor/toolbarButton';

describe('ToolbarButton component', () => {
  const onToggleSpy = jest.fn(() => {});
  it('should render an active toolbar button', () => {
    const props = {
      isActive: true,
      icon: 'text-bold',
      label: 'Bold',
      onToggle: onToggleSpy
    };
    const component = renderer.create(<ToolbarButton {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render an inactive toolbar button', () => {
    const props = {
      isActive: false,
      icon: 'text-italic',
      label: 'Italic',
      onToggle: onToggleSpy
    };
    const component = renderer.create(<ToolbarButton {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});