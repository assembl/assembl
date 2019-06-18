// @flow
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import renderer from 'react-test-renderer';

import DummyForm from './dummyForm';
import CheckboxListFieldAdapter from '../../../../js/app/components/form/checkboxListFieldAdapter';

configure({ adapter: new Adapter() });

describe('CheckboxListFieldAdapter component', () => {
  const onBlurSpy = jest.fn();
  const onChangeSpy = jest.fn();
  const onFocusSpy = jest.fn();
  const props = {
    input: {
      name: 'languages',
      onBlur: onBlurSpy,
      onChange: onChangeSpy,
      onFocus: onFocusSpy,
      value: [
        {
          isChecked: false,
          label: 'German',
          value: 'de'
        },
        {
          isChecked: false,
          label: 'English',
          value: 'en'
        },
        {
          isChecked: true,
          label: 'French',
          value: 'fr'
        }
      ]
    },
    meta: {
      error: '',
      touched: false
    }
  };

  it('should toggle isChecked when a checkbox is changed', () => {
    const wrapper = shallow(<CheckboxListFieldAdapter {...props} />);
    wrapper
      .find('Checkbox[value="fr"]')
      .props()
      .onChange();
    const expected = [
      {
        isChecked: false,
        label: 'German',
        value: 'de'
      },
      {
        isChecked: false,
        label: 'English',
        value: 'en'
      },
      {
        isChecked: false,
        label: 'French',
        value: 'fr'
      }
    ];
    expect(onChangeSpy).toHaveBeenCalledWith(expected);
  });

  it('should render a list of checkboxes multivalued field', () => {
    const component = renderer.create(
      <DummyForm>
        <CheckboxListFieldAdapter {...props} />
      </DummyForm>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a list of checkboxes multivalued field without value', () => {
    props.input.value = undefined;
    const component = renderer.create(
      <DummyForm>
        <CheckboxListFieldAdapter {...props} />
      </DummyForm>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a list of checkboxes multivalued field untouched with error', () => {
    props.input.value = undefined;
    props.meta = {
      error: 'This field is required',
      touched: false
    };
    const component = renderer.create(
      <DummyForm>
        <CheckboxListFieldAdapter {...props} />
      </DummyForm>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a list of checkboxes multivalued field touched with error', () => {
    props.meta = {
      error: 'This field is required',
      touched: true
    };
    const component = renderer.create(
      <DummyForm>
        <CheckboxListFieldAdapter {...props} />
      </DummyForm>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});