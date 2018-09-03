import React from 'react';
import renderer from 'react-test-renderer';
import CookiesSelector from '../../../../js/app/components/cookies/cookiesSelector';

describe('CookiesSelector component', () => {
  const handleCategorySelectionSpy = jest.fn(() => {});
  const handleSaveSpy = jest.fn(() => {});
  const handleToggleSpy = jest.fn(() => {});

  it('should render a list of cookieToggle components set in different categories', () => {
    const props = {
      cookies: {
        essential: [
          {
            category: 'essential',
            name: 'locale',
            hasChanged: false,
            accepted: true,
            cookieType: 'ACCEPT_LOCALE_ON_SESSION'
          }
        ],
        analytics: [
          {
            category: 'analytics',
            name: 'matomo',
            hasChanged: false,
            accepted: false,
            cookieType: 'REJECT_TRACKING_ON_DISCUSSION'
          }
        ]
      },
      activeKey: 'essential',
      show: true,
      handleCategorySelection: handleCategorySelectionSpy,
      handleSave: handleSaveSpy,
      handleToggle: handleToggleSpy
    };
    const rendered = renderer.create(<CookiesSelector {...props} />);
    expect(rendered).toMatchSnapshot();
  });
});