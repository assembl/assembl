import React from 'react';
import renderer from 'react-test-renderer';
import { gql } from 'react-apollo';

import { client } from '../../../../helpers/graphql';
import { DumbThemeCreationForm, updateTitle } from '../../../../../js/app/components/administration/survey/themeCreationForm';

const dummyFile = new File([''], 'foobar.png');

const query = gql`
  query GetThematics {
    thematics(identifier:"survey") {
      id,
      titleEntries {
        localeCode,
        value
      }
    }
  }
`;

describe('updateTitle function', () => {
  let thematics;
  client
    .query({
      query: query
    })
    .then((res) => {
      thematics = res.data.thematics;
      updateTitle(client, thematics[0].id, 'fr', 1, 'foobar');
      client
        .query({
          query: query
        })
        .then((newRes) => {
          const titleEntries = newRes.data.thematics[0].titleEntries;
          expect(titleEntries[1]).toEqual({
            localeCode: 'fr',
            value: 'foobar',
            __typename: 'LangStringEntry'
          });
        });
    });
});

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