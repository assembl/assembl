import React from 'react';
import renderer from 'react-test-renderer';

import { ThemeCreationForm } from '../../../../../js/app/components/administration/survey/themeCreationForm';

describe('ThemeCreationForm component', () => {
  it('should render a theme creation form', () => {
    const myFile = new File([''], 'foobar.png');
    const removeSpy = jest.fn(() => {});
    const updateTitleSpy = jest.fn(() => {});
    const updateImageSpy = jest.fn(() => {});
    const props = {
      id: '0',
      image: myFile,
      remove: removeSpy,
      selectedLocale: 'fr',
      title: 'My theme',
      updateTitle: updateTitleSpy,
      updateImage: updateImageSpy
    };
    const component = renderer.create(<ThemeCreationForm {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});