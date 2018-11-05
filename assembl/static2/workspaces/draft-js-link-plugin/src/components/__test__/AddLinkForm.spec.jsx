import React from 'react';
import renderer from 'react-test-renderer';

import AddLinkForm from '../AddLinkForm';

describe('AddLinkForm component', () => {
  it('should render a form to add a link', () => {
    const onSubmitSpy = jest.fn();
    const props = {
      initialValues: { text: 'driver' },
      onSubmit: onSubmitSpy
    };
    const component = renderer.create(<AddLinkForm {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});