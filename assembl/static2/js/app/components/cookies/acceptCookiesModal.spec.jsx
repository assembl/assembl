import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import { DumbAcceptCookiesModal } from './acceptCookiesModal';

configure({ adapter: new Adapter() });

const updateAcceptedCookiesSpy = jest.fn(() => {});

const defaultAcceptCookiesModalProps = {
  pathname: 'fakeSlug/home',
  id: '1234',
  hasTermsAndConditions: true,
  hasPrivacyPolicy: true,
  hasUserGuidelines: true,
  acceptedLegalContents: [],
  updateAcceptedCookies: updateAcceptedCookiesSpy,
  mandatoryLegalContentsValidation: true
};

describe('<AcceptCookiesModal /> - with shallow', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = shallow(<DumbAcceptCookiesModal {...defaultAcceptCookiesModalProps} />);
  });

  it('should render a modal when the user has not accepted all the required legal contents', () => {
    expect(wrapper.find('Modal[show=true]')).toHaveLength(1);
  });

  it('should not render a modal if the mandatory validation of the legal contents is not activated', () => {
    wrapper = shallow(<DumbAcceptCookiesModal {...defaultAcceptCookiesModalProps} mandatoryLegalContentsValidation={false} />);
    expect(wrapper.find('Modal[show=false]')).toHaveLength(1);
  });

  it('should not render a modal if the user has accepted every required legal contents', () => {
    wrapper = shallow(
      <DumbAcceptCookiesModal
        {...defaultAcceptCookiesModalProps}
        acceptedLegalContents={['ACCEPT_CGU', 'ACCEPT_PRIVACY_POLICY_ON_DISCUSSION', 'ACCEPT_USER_GUIDELINE_ON_DISCUSSION']}
      />
    );
    expect(wrapper.find('Modal[show=false]')).toHaveLength(1);
  });

  it('should render a modal with a disabled accept button as long as the user has not checked the checkbox', () => {
    expect(wrapper.find('Checkbox[checked=false]')).toHaveLength(1);
    expect(wrapper.find('Button[disabled=true]').last()).toHaveLength(1);
  });

  it('should render a modal with a non disabled accept button once the user has checked the checkbox', () => {
    wrapper.setState({ modalCheckboxIsChecked: true });
    expect(wrapper.find('Checkbox[checked=true]')).toHaveLength(1);
    expect(wrapper.find('Button[disabled=false]').last()).toHaveLength(1);
  });

  it('should launch the updateAcceptedCookies mutation when the user clicks on accept', () => {
    wrapper.setState({ modalCheckboxIsChecked: true });
    const acceptButton = wrapper.find('Button').last();
    acceptButton.simulate('click');
    expect(updateAcceptedCookiesSpy).toHaveBeenCalled();
  });
});