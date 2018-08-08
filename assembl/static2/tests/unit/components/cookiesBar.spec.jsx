import React from 'react';
import renderer from 'react-test-renderer';

import { DumbCookiesBar } from '../../../js/app/components/cookiesBar';

describe('CookiesBar component', () => {
  it('should render a bar with 2 buttons to accept the cookies policy or read them (bar is hidden by default)', () => {
    const component = renderer.create(<DumbCookiesBar />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});