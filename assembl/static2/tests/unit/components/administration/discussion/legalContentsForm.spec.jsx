import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbLegalContentsForm } from '../../../../../js/app/components/administration/discussion/legalContentsForm';

describe('LegalContentsForm dumb component', () => {
  it('should render a form to edit legal notice and terms and conditions', () => {
    const updateLegalNoticeSpy = jest.fn(() => {});
    const updateTermsAndConditionsSpy = jest.fn(() => {});
    const updateCookiesPolicySpy = jest.fn(() => {});
    const updatePrivacyPolicySpy = jest.fn(() => {});
    const props = {
      locale: 'en',
      legalNotice: '',
      termsAndConditions: '',
      cookiesPolicy: '',
      privacyPolicy: '',
      updateLegalNotice: updateLegalNoticeSpy,
      updateTermsAndConditions: updateTermsAndConditionsSpy,
      updateCookiesPolicy: updateCookiesPolicySpy,
      updatePrivacyPolicy: updatePrivacyPolicySpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbLegalContentsForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});