import React from 'react';
import renderer from 'react-test-renderer';

import FormControlWithLabel from '../../../../js/app/components/common/formControlWithLabel';

describe('FormControlWithLabel component', () => {
  const onChangeSpy = jest.fn(() => {});

  it('should render a form control with label', () => {
    const component = renderer.create(
      <FormControlWithLabel
        componentClass="my-class"
        id="my-input"
        label="Foobar"
        onChange={onChangeSpy}
        type="text"
        disabled={false}
      />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a form control with label with a value', () => {
    const component = renderer.create(
      <FormControlWithLabel
        componentClass="my-class"
        id="my-input"
        label="Foobar"
        onChange={onChangeSpy}
        type="text"
        value="some-value"
        disabled={false}
      />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should validate the input if its required prop is true');
});