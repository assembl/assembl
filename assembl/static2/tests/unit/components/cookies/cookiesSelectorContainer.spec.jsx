import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { DumbCookiesSelectorContainer } from '../../../../js/app/components/cookies/cookiesSelectorContainer';
import CookiesSelector from '../../../../js/app/components/cookies/cookiesSelector';
import { COOKIE_TRANSLATION_KEYS, COOKIES_CATEGORIES } from '../../../../js/app/constants';
import { displayAlert } from '../../../../js/app/utils/utilityManager';

configure({ adapter: new Adapter() });

jest.mock('../../../../js/app/utils/utilityManager');

const { userSession, matomo, privacyPolicy, userGuideline, cgu, locale } = COOKIE_TRANSLATION_KEYS;
const { essential, analytics } = COOKIES_CATEGORIES;

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
          category: 'essential',
          name: userSession
        })
      );
    });
  });
  describe('getCookiesObjectFromArray method', () => {
    it('should return an object with every cookie ordered by category', () => {
      expect(
        instance.getCookiesObjectFromArray([
          {
            category: 'essential',
            name: userSession,
            accepted: true
          }
        ])
      ).toEqual({
        essential: [
          {
            category: 'essential',
            name: userSession,
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
  describe('handleToggle method', () => {
    it('should update the cookies in the state', () => {
      const updatedCookie = {
        category: analytics,
        name: matomo,
        accepted: false,
        cookieType: 'REJECT_TRACKING_ON_DISCUSSION'
      };

      wrapper.instance().handleToggle(updatedCookie);
      expect(JSON.stringify(wrapper.state('cookies'))).toBe(
        JSON.stringify({
          analytics: [
            {
              category: analytics,
              name: matomo,
              accepted: false,
              cookieType: 'REJECT_TRACKING_ON_DISCUSSION'
            }
          ],
          essential: [
            {
              category: essential,
              name: userSession,
              accepted: true,
              cookieType: 'ACCEPT_SESSION_ON_DISCUSSION'
            },
            {
              category: essential,
              name: locale,
              accepted: true,
              cookieType: 'ACCEPT_LOCALE'
            },
            {
              category: essential,
              name: privacyPolicy,
              accepted: true,
              cookieType: 'ACCEPT_PRIVACY_POLICY_ON_DISCUSSION'
            },
            {
              category: essential,
              name: userGuideline,
              accepted: true,
              cookieType: 'ACCEPT_USER_GUIDELINE_ON_DISCUSSION'
            },
            {
              category: essential,
              name: cgu,
              accepted: true,
              cookieType: 'ACCEPT_CGU'
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
      expect(document.cookie).toBe(
        'cookies_configuration=ACCEPT_TRACKING_ON_DISCUSSION,ACCEPT_SESSION_ON_DISCUSSION,ACCEPT_LOCALE,' +
          `ACCEPT_PRIVACY_POLICY_ON_DISCUSSION,ACCEPT_USER_GUIDELINE_ON_DISCUSSION,ACCEPT_CGU;path=/;expires=${date}`
      );
    });
  });
});