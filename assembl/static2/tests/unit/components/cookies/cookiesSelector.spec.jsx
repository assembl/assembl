import React from 'react';
import renderer from 'react-test-renderer';
import { DumbCookiesSelector } from '../../../../js/app/components/cookies/cookiesSelector';

describe('CookiesSelector component', () => {
  it('should render a list of cookieToggle components set in different categories', () => {
    const rendered = renderer.create(<DumbCookiesSelector />);
    expect(rendered).toMatchSnapshot();
  });
});