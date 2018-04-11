import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbLegalNoticeAndTermsForm } from '../../../../../js/app/components/administration/discussion/legalNoticeAndTermsForm';
import '../../../../helpers/setupTranslations';

describe('LegalNoticeAndTermsForm dumb component', () => {
  it('should render a form to edit legal notice and terms and conditions', () => {
    const updateLegalNoticeSpy = jest.fn(() => {});
    const updateTermsAndConditionsSpy = jest.fn(() => {});
    const props = {
      locale: 'en',
      legalNotice: '',
      termsAndConditions: '',
      updateLegalNotice: updateLegalNoticeSpy,
      updateTermsAndConditions: updateTermsAndConditionsSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbLegalNoticeAndTermsForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});