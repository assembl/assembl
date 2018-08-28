import React from 'react';
import renderer from 'react-test-renderer';

import PluginModal from '../PluginModal';

describe('PluginModal component', () => {
  it('should render a modal', () => {
    const closeSpy = jest.fn();
    const props = {
      children: <div>Try to reboot the TCP pixel!</div>,
      close: closeSpy,
      closeLabel: 'Close',
      title: 'My modal'
    };
    const component = renderer.create(<PluginModal {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});