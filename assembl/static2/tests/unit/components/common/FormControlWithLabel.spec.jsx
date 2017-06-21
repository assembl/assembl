import React from 'react';
import renderer from 'react-test-renderer';

import FormControlWithLabel from '../../../../js/app/components/common/formControlWithLabel';

describe('FormControlWithLabel component', () => {
  const onChangeSpy = jest.fn(() => {});

  it('should render form control with label', () => {
    const component = renderer.create(<FormControlWithLabel componentClass="my-class" id="my-input" label="Foobar" onChange={onChangeSpy} type="text" />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render form control with label with a value', () => {
    const component = renderer.create(<FormControlWithLabel componentClass="my-class" id="my-input" label="Foobar" onChange={onChangeSpy} type="text" value="some-value" />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});