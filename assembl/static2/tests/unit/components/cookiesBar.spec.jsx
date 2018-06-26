import React from 'react';
import renderer from 'react-test-renderer';

import CookiesBar from '../../../js/app/components/cookiesBar';

describe('CookiesBar component', () => {
  it('should render a bar with 2 buttons to accept the cookies policy or read them', () => {
    const component = renderer.create(<CookiesBar />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});