import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import ExportSection from '../../../../js/app/components/administration/exportSection';

describe('ExportSection component', () => {
  it('should render an ExportSection component without languages options', () => {
    const props = {
      exportType: 'voteSession',
      voteSessionId: '123',
      debateId: '7',
      exportLink: 'foo.com'
    };
    const renderer = new ShallowRenderer();
    renderer.render(<ExportSection {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
  it('should render an ExportSection component with languages options', () => {
    const handleExportLocaleChangeSpy = jest.fn(() => {});
    const handleTranslationChangeSpy = jest.fn(() => {});
    const props = {
      exportType: 'survey',
      voteSessionId: '123',
      debateId: '7',
      withLanguageOptions: true,
      exportLink: 'foo.com',
      handleExportLocaleChange: handleExportLocaleChangeSpy,
      handleTranslationChange: handleTranslationChangeSpy,
      languages: [
        { locale: 'fr', name: 'French', nativeName: 'français', __typename: 'LocalePreference' },
        { locale: 'en', name: 'English', nativeName: 'English', __typename: 'LocalePreference' }
      ]
    };
    const renderer = new ShallowRenderer();
    renderer.render(<ExportSection {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});