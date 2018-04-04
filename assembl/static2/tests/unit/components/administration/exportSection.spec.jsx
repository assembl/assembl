import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { DumbExportSection } from '../../../../js/app/components/administration/exportSection';

describe('ExportSection component', () => {
  it('should render an ExportSection component without languages options', () => {
    const props = {
      exporttype: 'voteSession',
      voteSessionId: '123'
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbExportSection {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
  it('should render an ExportSection component with languages options', () => {
    const props = {
      exporttype: 'survey',
      voteSessionId: '123',
      languages: [{ locale: 'fr', name: 'French', nativeName: 'français', __typename: 'LocalePreference' },
        { locale: 'en', name: 'English', nativeName: 'English', __typename: 'LocalePreference' }
      ]
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbExportSection {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});