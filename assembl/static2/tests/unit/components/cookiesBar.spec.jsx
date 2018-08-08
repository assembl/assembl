import React from 'react';
import renderer from 'react-test-renderer';

import { DumbCookiesBar } from '../../../js/app/components/cookiesBar';

describe('CookiesBar component', () => {
  const updateAcceptedCookiesSpy = jest.fn();
  it('should render a bar with 2 buttons to accept the cookies policy or read them', () => {
    const props = {
      updateAcceptedCookies: updateAcceptedCookiesSpy,
      acceptedCookies: []
    };
    const component = renderer.create(<DumbCookiesBar {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
  it('should render a hidden bar if all or some cookies have been accepted by the user', () => {
    const props = {
      updateAcceptedCookies: updateAcceptedCookiesSpy,
      acceptedCookies: ['ACCEPT_SESSION_ON_DISCUSSION']
    };
    const component = renderer.create(<DumbCookiesBar {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});