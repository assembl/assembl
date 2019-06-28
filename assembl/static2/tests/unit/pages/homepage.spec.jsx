import React from 'react';
import renderer from 'react-test-renderer';
import configureStore from 'redux-mock-store';
import { MockedProvider } from 'react-apollo/test-utils';

import { DumbHome } from '../../../js/app/pages/home';
import { modules as fakeModules } from '../components/administration/landingPage/fakeData';

describe('Homepage component', () => {
  it('should render configured modules', () => {
    const timeline = [
      {
        id: 'RGlzY3Vzc2lvblBoYXNlOjE=',
        identifier: '1',
        start: '2019-05-08T00:00:00+00:00',
        end: '2019-05-31T00:00:00+00:00',
        image: null,
        title: 'Phase 1',
        description: 'First phase of the debate'
      },
      {
        id: 'RGlzY3Vzc2lvblBoYXNlOjI=',
        identifier: '2',
        start: '2019-06-04T00:00:00+00:00',
        end: '2019-06-30T00:00:00+00:00',
        image: {
          mimeType: 'image/jpeg',
          title: 'phase2.jpg',
          externalUrl: 'http://localhost:6543/data/Discussion/1/documents/1/data'
        },
        title: 'Phase 2',
        description: 'Second phase of the debate'
      }
    ];
    const props = {
      debate: {
        debateData: {}
      },
      location: { state: undefined },
      landingPageModules: fakeModules.map(v => v.toJS()),
      store: {},
      timeline: timeline
    };
    const state = { i18n: { locale: 'en' } };

    const mockStore = configureStore();
    const store = mockStore(state);

    const rendered = renderer
      .create(
        <MockedProvider mocks={[]} store={store}>
          <DumbHome {...props} />
        </MockedProvider>
      )
      .toJSON();
    // FIXME: snapshot is very poor. why ?
    expect(rendered).toMatchSnapshot();
  });
});