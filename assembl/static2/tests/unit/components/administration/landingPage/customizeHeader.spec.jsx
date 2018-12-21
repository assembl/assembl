import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbCustomizeHeader } from '../../../../../js/app/components/administration/landingPage/header/index';

describe('ManageModules component', () => {
  it('should render a page to manage the landing page header', () => {
    const data = {
      discussion: {
        logoImage: null,
        headerImage: {
          mimeType: 'image/png',
          title: 'Screen Shot 2018-11-23 at 5.09.00 PM.png',
          externalUrl: 'http://localhost:6543/data/Discussion/32/documents/689/data'
        },
        title: 'Title in EN 13',
        titleEntries: [
          {
            localeCode: 'en',
            value: 'Title in EN 13',
            __typename: 'LangStringEntry'
          }
        ],
        subtitle: '<p>subtitle in EN 13</p>',
        subtitleEntries: [
          {
            localeCode: 'en',
            value: '<p>subtitle in EN 13</p>',
            __typename: 'LangStringEntry'
          }
        ],
        buttonLabel: 'button in EN 13',
        buttonLabelEntries: [
          {
            localeCode: 'en',
            value: 'button in EN 13',
            __typename: 'LangStringEntry'
          }
        ],
        homepageUrl: null,
        loginData: {
          local: true,
          url: '/qa-debate-fred/login'
        },
        startDate: '2017-09-13T00:00:00+00:00',
        endDate: '2017-11-25T00:00:00+00:00'
      }
    };
    const props = {
      client: null,
      editlocale: 'en',
      data: { ...data }
    };

    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbCustomizeHeader {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});