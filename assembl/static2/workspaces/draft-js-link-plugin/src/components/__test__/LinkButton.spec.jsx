import React from 'react';
import renderer from 'react-test-renderer';

import LinkButton from '../LinkButton';

describe('LinkButton component', () => {
  it('should render a link button', () => {
    const getEditorStateSpy = jest.fn();
    const setEditorStateSpy = jest.fn();
    const props = {
      modal: {
        current: null
      },
      store: {
        getEditorState: getEditorStateSpy,
        setEditorState: setEditorStateSpy
      },
      theme: {
        button: 'btn',
        buttonWrapper: 'btn-group'
      }
    };
    const component = renderer.create(<LinkButton {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  // TODO: test that modal is rendered in portal
  it('should render a link button with an opened modal');
});