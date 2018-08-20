// @flow
import React from 'react';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { DumbCookiesSelectorContainer } from '../../../../js/app/components/cookies/cookiesSelectorContainer';
import CookiesSelector from '../../../../js/app/components/cookies/cookiesSelector';
import { COOKIE_TRANSLATION_KEYS } from '../../../../js/app/constants';

configure({ adapter: new Adapter() });

describe('CookiesSelectorContainer component', () => {
  let wrapper;
  let updateAcceptedCookiesSpy;
  let instance;
  beforeEach(() => {
    updateAcceptedCookiesSpy = jest.fn();
    wrapper = shallow(<DumbCookiesSelectorContainer
      updateAcceptedCookies={updateAcceptedCookiesSpy}
      cookiesList={['ACCEPT_TRACKING_ON_DISCUSSION']}
    />);
    instance = wrapper.instance();
  });
  it('should render a Cookies Selector', () => {
    expect(wrapper.find(CookiesSelector)).toHaveLength(1);
  });

  describe('getCookieObjectData method', () => {
    it('should return a certain object for a given cookie string', () => {
      expect(instance.getCookieObjectData('ACCEPT_SESSION_ON_DISCUSSION')).toBe({
        category: 'other',
        name: COOKIE_TRANSLATION_KEYS.userSession,
        hasChanged: false
      });
    });
  });
  describe('getCookiesObjectFromArray method', () => {
    it('should return an object with every cookie ordered by category', () => {
      expect(JSON.stringify(instance.getCookiesObjectFromArray([{
        category: 'other',
        name: COOKIE_TRANSLATION_KEYS.userSession,
        hasChanged: false,
        accepted: true
      }]))).toEqual(JSON.stringify({
        other: [{
          category: 'other',
          name: COOKIE_TRANSLATION_KEYS.userSession,
          hasChanged: false,
          accepted: true
        }]
      }));
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
      const componentWithCookiesList = shallow(<DumbCookiesSelectorContainer
        cookiesList={['ACCEPT_SESSION_ON_DISCUSSION']}
      />);
      const updatedCookie = {
        category: 'other',
        name: COOKIE_TRANSLATION_KEYS.userSession,
        hasChanged: true,
        accepted: false,
        cookieType: 'REJECT_SESSION_ON_DISCUSSION'
      };
      const newInstance = componentWithCookiesList.instance();
      newInstance.handleToggle(updatedCookie);
      expect(componentWithCookiesList.state('cookies')).toBe({
        other: [{
          category: 'other',
          name: COOKIE_TRANSLATION_KEYS.userSession,
          hasChanged: true,
          accepted: false,
          cookieType: 'REJECT_SESSION_ON_DISCUSSION'
        }] }
      );
    });
  });
  describe('saveChanges method', () => {
    it('should call the updateAcceptedCookies function', () => {
      instance.saveChanges();
      expect(instance.updateAcceptedCookies).toHaveBeenCalledTimes(1);
    });
  });
});