import React from 'react';
import renderer from 'react-test-renderer';

import MultilingualTextFieldAdapter from '../../../../js/app/components/form/multilingualTextFieldAdapter';

describe('MultilingualTextFieldAdapter component', () => {
  const onChangeSpy = jest.fn();
  const onFocusSpy = jest.fn();

  it('should render a text field', () => {
    const props = {
      editLocale: 'fr',
      input: {
        name: 'title',
        onChange: onChangeSpy,
        onFocus: onFocusSpy,
        value: {
          en: 'Hello',
          fr: 'Bonjour'
        }
      },
      label: 'Title',
      meta: {
        error: '',
        touched: false
      }
    };
    const component = renderer.create(<MultilingualTextFieldAdapter {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a text field without value', () => {
    const props = {
      editLocale: 'fr',
      input: {
        name: 'title',
        onChange: onChangeSpy,
        onFocus: onFocusSpy
      },
      label: 'Title',
      meta: {
        error: '',
        touched: false
      }
    };
    const component = renderer.create(<MultilingualTextFieldAdapter {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a text field untouched with error', () => {
    const props = {
      editLocale: 'fr',
      input: {
        name: 'title',
        onChange: onChangeSpy,
        onFocus: onFocusSpy
      },
      label: 'Title',
      meta: {
        error: 'This field is required',
        touched: false
      }
    };
    const component = renderer.create(<MultilingualTextFieldAdapter {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a text field touched with error', () => {
    const props = {
      editLocale: 'fr',
      input: {
        name: 'title',
        onChange: onChangeSpy,
        onFocus: onFocusSpy
      },
      label: 'Title',
      meta: {
        error: 'This field is required',
        touched: true
      }
    };
    const component = renderer.create(<MultilingualTextFieldAdapter {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});