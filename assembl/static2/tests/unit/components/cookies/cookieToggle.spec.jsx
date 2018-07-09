import React from 'react';
import renderer from 'react-test-renderer';
import CookieToggle from '../../../../js/app/components/cookies/cookieToggle';

describe('CookieToggle component', () => {
  const handleToggleSpy = jest.fn(() => {});
  it('should render a cookie\'s name with a toggle to change its setting', () => {
    const props = {
      cookie: {
        name: 'userSession',
        category: 'essential',
        accepted: true
      },
      handleToggle: handleToggleSpy
    };
    const rendered = renderer.create(<CookieToggle {...props} />);
    expect(rendered).toMatchSnapshot();
  });
});