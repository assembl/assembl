import React from 'react';
import renderer from 'react-test-renderer';

import TextFieldAdapter from '../../../../js/app/components/form/textFieldAdapter';

describe('TextFieldAdapter component', () => {
  const onChangeSpy = jest.fn();
  const onFocusSpy = jest.fn();

  it('should render a text field', () => {
    const props = {
      input: {
        name: 'fullname',
        onChange: onChangeSpy,
        onFocus: onFocusSpy,
        value: 'Amber Zieme'
      },
      label: 'Full name',
      meta: {
        error: '',
        touched: false
      }
    };
    const component = renderer.create(<TextFieldAdapter {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a text field without value', () => {
    const props = {
      input: {
        name: 'fullname',
        onChange: onChangeSpy,
        onFocus: onFocusSpy
      },
      label: 'Full name',
      meta: {
        error: '',
        touched: false
      }
    };
    const component = renderer.create(<TextFieldAdapter {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a text field untouched with error', () => {
    const props = {
      input: {
        name: 'fullname',
        onChange: onChangeSpy,
        onFocus: onFocusSpy,
        value: 'Amber Zieme'
      },
      label: 'Full name',
      meta: {
        error: 'This field is required',
        touched: false
      }
    };
    const component = renderer.create(<TextFieldAdapter {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a text field touched with error', () => {
    const props = {
      input: {
        name: 'fullname',
        onChange: onChangeSpy,
        onFocus: onFocusSpy,
        value: 'Amber Zieme'
      },
      label: 'Full name',
      meta: {
        error: 'This field is required',
        touched: true
      }
    };
    const component = renderer.create(<TextFieldAdapter {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});