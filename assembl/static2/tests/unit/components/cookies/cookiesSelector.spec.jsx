import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import CookiesSelector from '../../../../js/app/components/cookies/cookiesSelector';
import CookieSetter from '../../../../js/app/components/cookies/cookieSetter';

configure({ adapter: new Adapter() });

const handleSaveSpy = jest.fn(() => {});
const handleToggleSpy = jest.fn(() => {});

const Props = {
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
  handleSave: handleSaveSpy,
  handleToggle: handleToggleSpy,
  settingsHaveChanged: true
};

describe('<CookiesSelector /> - with shallow', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = shallow(<CookiesSelector {...Props} />);
  });

  it('should render the essential list of cookies', () => {
    wrapper.setState({ selectedCategory: 'essential' });
    expect(wrapper.find(CookieSetter)).toHaveLength(1);
  });

  it('should not render a list of cookie when nothing is selected', () => {
    wrapper.setState({ selectedCategory: null });
    expect(wrapper.find(CookieSetter)).toHaveLength(0);
  });
});