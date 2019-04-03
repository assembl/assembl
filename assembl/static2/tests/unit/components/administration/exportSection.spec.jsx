import React from 'react';
import renderer from 'react-test-renderer';
import 'react-dates/initialize';
import ExportSection from '../../../../js/app/components/administration/exportSection';

describe('ExportSection component', () => {
  it('should render an ExportSection component without any option', () => {
    const props = {
      exportLink: 'foo.com'
    };
    const component = renderer.create(<ExportSection {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render an ExportSection component with the anonymous option', () => {
    const handleAnonymousChangeSpy = jest.fn(() => {});
    const props = {
      exportLink: 'foo.com',
      handleAnonymousChange: handleAnonymousChangeSpy
    };
    const component = renderer.create(<ExportSection {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render an ExportSection component with languages options', () => {
    const handleExportLocaleChangeSpy = jest.fn(() => {});
    const handleTranslationChangeSpy = jest.fn(() => {});
    const handleShouldTranslateSpy = jest.fn(() => {});
    const props = {
      exportLink: 'foo.com',
      handleExportLocaleChange: handleExportLocaleChangeSpy,
      handleShouldTranslate: handleShouldTranslateSpy,
      handleTranslationChange: handleTranslationChangeSpy,
      shouldTranslate: true,
      languages: [
        { locale: 'fr', name: 'French', nativeName: 'français', __typename: 'LocalePreference' },
        { locale: 'en', name: 'English', nativeName: 'English', __typename: 'LocalePreference' }
      ]
    };
    const component = renderer.create(<ExportSection {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render an ExportSection component with dates options', () => {
    const handleDatesChangeSpy = jest.fn(() => {});
    const props = {
      exportLink: 'foo.com',
      handleDatesChange: handleDatesChangeSpy,
      locale: 'fr'
    };
    const component = renderer.create(<ExportSection {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});