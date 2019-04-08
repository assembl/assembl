import React from 'react';
import renderer from 'react-test-renderer';
import 'react-dates/initialize';
import { DumbExportData } from '../../../../js/app/pages/exportData';

describe('ExportData page', () => {
  const props = {
    locale: 'fr',
    languages: [
      { locale: 'fr', name: 'French', nativeName: 'français', __typename: 'LocalePreference' },
      { locale: 'en', name: 'English', nativeName: 'English', __typename: 'LocalePreference' }
    ],
    phases: [
      {
        id: 'foo',
        identifier: '120',
        start: '2019-02-13T00:00:00+00:00',
        end: '2019-03-07T00:00:00+00:00',
        image: null,
        title: 'Première phase',
        description: 'description phase 1'
      },
      {
        description: 'description phase 2',
        end: '2019-03-30T00:00:00+00:00',
        id: 'RGlzY3Vzc2lvblBoYXNlOjExOQ==',
        identifier: '119',
        image: null,
        start: '2019-03-07T00:00:00+00:00',
        title: 'Seconde phase'
      }
    ]
  };
  it('should render an ExportData page with an ExportSection for multimodule data', () => {
    const component = renderer.create(<DumbExportData {...props} section="1" />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
  it('should render an ExportData page with an ExportSection for taxonomies', () => {
    const component = renderer.create(<DumbExportData {...props} section="2" />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});