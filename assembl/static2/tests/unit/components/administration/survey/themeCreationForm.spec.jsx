import React from 'react';
import renderer from 'react-test-renderer';

import { DumbThemeCreationForm } from '../../../../../js/app/components/administration/survey/themeCreationForm';

const dummyFile = new File([''], 'foobar.png');

describe('ThemeCreationForm component', () => {
  it('should render a theme creation form', () => {
    const props = {
      id: '5eP3dtGl',
      index: '0',
      image: dummyFile,
      selectedLocale: 'fr',
      titleEntries: [{ localeCode: 'fr', value: 'My theme' }, { localeCode: 'en', value: 'Ma thématique' }]
    };
    const component = renderer.create(<DumbThemeCreationForm {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});