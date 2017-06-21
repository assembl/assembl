import React from 'react';
import renderer from 'react-test-renderer';
import ShallowRenderer from 'react-test-renderer/shallow';
import TestUtils from 'react-dom/test-utils';
import { FormControl } from 'react-bootstrap';

import FormControlWithLabel from '../../../../js/app/components/common/formControlWithLabel';

describe('FormControlWithLabel component', () => {
  const onChangeSpy = jest.fn(() => {});

  it('should render a form control with label', () => {
    const component = renderer.create(<FormControlWithLabel componentClass="my-class" id="my-input" label="Foobar" onChange={onChangeSpy} type="text" />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a form control with label with a value', () => {
    const component = renderer.create(<FormControlWithLabel componentClass="my-class" id="my-input" label="Foobar" onChange={onChangeSpy} type="text" value="some-value" />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should validate the input if its required prop is true');
});