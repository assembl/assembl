import React from 'react';
import renderer from 'react-test-renderer';

import { ThemeCreationForm, mapStateToProps, mapDispatchToProps } from '../../../../../js/app/components/administration/survey/themeCreationForm';
import * as actions from '../../../../../js/app/actions/adminActions';

const dummyFile = new File([''], 'foobar.png');

describe('ThemeCreationForm component', () => {
  it('should render a theme creation form', () => {
    const removeSpy = jest.fn(() => {});
    const updateTitleSpy = jest.fn(() => {});
    const updateImageSpy = jest.fn(() => {});
    const props = {
      id: '0',
      image: dummyFile,
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

describe('ThemeCreationForm container', () => {
  it('should map state to props', () => {
    const state = {
      admin: {
        surveyThemesById: {
          0: {
            titlesByLocale: {
              fr: 'Ma thématique',
              en: 'My theme'
            },
            image: { name: 'myimage.png' }
          }
        }
      }
    };
    const ownProps = { id: '0', selectedLocale: 'en' };
    const actual = mapStateToProps(state, ownProps);
    const expected = {
      title: 'My theme',
      image: { name: 'myimage.png' }
    };
    expect(actual).toEqual(expected);
  });

  it('should map dispatch to props', () => {
    const dispatchMock = (x) => {
      return x;
    };
    const ownProps = {
      id: '0',
      selectedLocale: 'fr'
    };
    const actual = mapDispatchToProps(dispatchMock, ownProps);
    const expectedRemove = actions.removeTheme('0');
    const expectedUpdateTitle = actions.updateThemeTitle('0', 'fr', 'Foobar');
    const expectedUpdateImage = actions.updateThemeImage('0', dummyFile);
    expect(actual.remove()).toEqual(expectedRemove);
    expect(actual.updateTitle('Foobar')).toEqual(expectedUpdateTitle);
    expect(actual.updateImage([dummyFile])).toEqual(expectedUpdateImage);
  });
});