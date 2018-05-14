import React from 'react';
import renderer from 'react-test-renderer';

import ConfiguredField from '../../../../js/app/components/common/configuredField';
import '../../../helpers/setupTranslations';

describe('ConfiguredField component', () => {
  it('should match ConfiguredField snapshot (TEXT)', () => {
    const handleValueChangeSpy = jest.fn();
    const props = {
      configurableField: {
        fieldType: 'TEXT',
        id: 'my-field',
        required: true,
        title: 'My field',
        __typename: 'TextField'
      },
      handleValueChange: handleValueChangeSpy,
      value: 'foobar'
    };
    const rendered = renderer.create(<ConfiguredField {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });

  it('should match ConfiguredField snapshot (PASSWORD)', () => {
    const handleValueChangeSpy = jest.fn();
    const props = {
      configurableField: {
        fieldType: 'PASSWORD',
        id: 'my-field',
        required: true,
        title: 'My password field',
        __typename: 'TextField'
      },
      handleValueChange: handleValueChangeSpy,
      value: 'foobar'
    };
    const rendered = renderer.create(<ConfiguredField {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });

  it('should match ConfiguredField snapshot (EMAIL)', () => {
    const handleValueChangeSpy = jest.fn();
    const props = {
      configurableField: {
        fieldType: 'EMAIL',
        id: 'my-field',
        required: false,
        title: 'My email field',
        __typename: 'TextField'
      },
      handleValueChange: handleValueChangeSpy,
      value: 'foobar'
    };
    const rendered = renderer.create(<ConfiguredField {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});