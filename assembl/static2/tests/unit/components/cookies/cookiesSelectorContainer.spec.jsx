import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { DumbCookiesSelectorContainer } from '../../../../js/app/components/cookies/cookiesSelectorContainer';
import CookiesSelector from '../../../../js/app/components/cookies/cookiesSelector';
import { COOKIE_TRANSLATION_KEYS } from '../../../../js/app/constants';
import { displayAlert } from '../../../../js/app/utils/utilityManager';

configure({ adapter: new Adapter() });

jest.mock('../../../../js/app/utils/utilityManager');

describe('CookiesSelectorContainer component', () => {
  let wrapper;
  let updateAcceptedCookiesSpy;
  let instance;
  beforeEach(() => {
    updateAcceptedCookiesSpy = jest.fn();
    wrapper = mount(
      <DumbCookiesSelectorContainer
        updateAcceptedCookies={updateAcceptedCookiesSpy}
        cookiesList={['ACCEPT_TRACKING_ON_DISCUSSION']}
      />
    );
    instance = wrapper.instance();
  });
  it('should render a Cookies Selector', () => {
    expect(wrapper.find(CookiesSelector)).toHaveLength(1);
  });

  describe('getCookieObjectData method', () => {
    it('should return a certain object for a given cookie string', () => {
      expect(JSON.stringify(instance.getCookieObjectData('ACCEPT_SESSION_ON_DISCUSSION'))).toBe(
        JSON.stringify({
          category: 'other',
          name: COOKIE_TRANSLATION_KEYS.userSession
        })
      );
    });
  });
  describe('getCookiesObjectFromArray method', () => {
    it('should return an object with every cookie ordered by category', () => {
      expect(
        instance.getCookiesObjectFromArray([
          {
            category: 'other',
            name: COOKIE_TRANSLATION_KEYS.userSession,
            accepted: true
          }
        ])
      ).toEqual({
        other: [
          {
            category: 'other',
            name: COOKIE_TRANSLATION_KEYS.userSession,
            accepted: true
          }
        ]
      });
    });
  });
  describe('isCookieAccepted method', () => {
    it('should return true for any cookie starting with \'ACCEPT\'', () => {
      expect(instance.isCookieAccepted('ACCEPT_SESSION_ON_DISCUSSION')).toBe(true);
    });
    it('should return false for any other kind of cookie', () => {
      expect(wrapper.instance().isCookieAccepted('REJECT_TRACKING_ON_DISCUSSION')).toBe(false);
      expect(wrapper.instance().isCookieAccepted('FOO')).toBe(false);
    });
  });
  describe('toggleCookieType method', () => {
    it('should return the REJECT version of a cookie string', () => {
      expect(instance.toggleCookieType('ACCEPT_TRACKING_ON_DISCUSSION')).toBe('REJECT_TRACKING_ON_DISCUSSION');
    });
    it('should return the ACCEPT version of a cookie string', () => {
      expect(instance.toggleCookieType('REJECT_TRACKING_ON_DISCUSSION')).toBe('ACCEPT_TRACKING_ON_DISCUSSION');
    });
  });
  describe('handleCategorySelection method', () => {
    it('should update the activeKey in the state', () => {
      expect(wrapper.state('activeKey')).toBe('essential');
      instance.handleCategorySelection('other');
      expect(wrapper.state('activeKey')).toBe('other');
    });
  });
  describe('handleToggle method', () => {
    it('should update the cookies in the state', () => {
      const updatedCookie = {
        category: 'analytics',
        name: COOKIE_TRANSLATION_KEYS.piwik,
        accepted: false,
        cookieType: 'REJECT_TRACKING_ON_DISCUSSION'
      };

      wrapper.instance().handleToggle(updatedCookie);
      expect(JSON.stringify(wrapper.state('cookies'))).toBe(
        JSON.stringify({
          analytics: [
            {
              category: 'analytics',
              name: COOKIE_TRANSLATION_KEYS.piwik,
              accepted: false,
              cookieType: 'REJECT_TRACKING_ON_DISCUSSION'
            }
          ]
        })
      );
    });
  });
  describe('saveChanges method', () => {
    it('should call the updateAcceptedCookies function and set document.cookie with a new value', () => {
      displayAlert.mockImplementation(() => {});
      instance.saveChanges();
      expect(updateAcceptedCookiesSpy.mock.calls.length).toBe(1);
      const date = new Date();
      date.setMonth(date.getMonth() + 13);
      expect(document.cookie).toBe(`cookies_configuration=ACCEPT_TRACKING_ON_DISCUSSION; path=/;expires=${date}`);
    });
  });
});