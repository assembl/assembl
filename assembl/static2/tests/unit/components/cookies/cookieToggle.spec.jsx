import React from 'react';
import renderer from 'react-test-renderer';
import CookieSwitch from '../../../../js/app/components/cookies/cookieSwitch';

describe('CookieSwitch component', () => {
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
    const rendered = renderer.create(<CookieSwitch {...props} />);
    expect(rendered).toMatchSnapshot();
  });
});