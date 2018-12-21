// @flow

import React from 'react';
import renderer from 'react-test-renderer';

import Flag from '../../../../../js/app/components/svg/taxonomy/Flag';

describe('Flag component', () => {
  it('should render a colored flag svg', () => {
    const props = {
      color: '#123456'
    };
    const component = renderer.create(<Flag {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});