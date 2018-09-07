// @flow
import React from 'react';
import { configure, mount } from 'enzyme';
import { MockedProvider } from 'react-apollo/test-utils';
import Adapter from 'enzyme-adapter-react-16';
// Graphql imports
import BrightMirrorFictionQuery from '../../../js/app/graphql/BrightMirrorFictionQuery.graphql';
// Containers import
import { BrightMirrorFiction } from '../../../js/app/pages/brightMirrorFiction';
// Components imports
import FictionHeader from '../../../js/app/components/debate/brightMirror/fictionHeader';
import FictionToolbar from '../../../js/app/components/debate/brightMirror/fictionToolbar';
import FictionBody from '../../../js/app/components/debate/brightMirror/fictionBody';
// Type imports
import type { BrightMirrorFictionData, BrightMirrorFictionProps } from '../../../js/app/pages/brightMirrorFiction';

configure({ adapter: new Adapter() });

// Mock utils functions
jest.mock('../../../js/app/utils/utilityManager', () => ({ displayAlert: jest.fn() }));

const brightMirrorFictionData: BrightMirrorFictionData = {
  fiction: {
    subject: 'Hic quia eveniet cupiditate placeat laboriosam.',
    body: 'Odit mollitia natus ea iusto voluptatibus omnis pariatur tempore ipsum.',
    creationDate: new Date(),
    creator: {
      userId: 99999999,
      displayName: 'Wendy Quigley',
      isDeleted: false,
      image: {
        externalUrl: 'http://tyrese.info'
      }
    }
  },
  error: null
};

describe('<BrightMirrorFiction /> - with mount', () => {
  let wrapper;
  let mocks;
  let brightMirrorFictionProps: BrightMirrorFictionProps;

  beforeEach(() => {
    // Define props
    brightMirrorFictionProps = {
      data: brightMirrorFictionData,
      slug: 'voluptatem-veritatis-ea',
      phase: 'hic',
      themeId: 'nihil',
      fictionId: 'deleniti',
      contentLocale: 'en'
    };

    // Mock Apollo
    mocks = [
      {
        request: { query: BrightMirrorFictionQuery },
        result: {
          data: brightMirrorFictionData
        }
      }
    ];

    wrapper = mount(
      <MockedProvider mocks={mocks}>
        <BrightMirrorFiction {...brightMirrorFictionProps} />
      </MockedProvider>
    );
  });

  it('should render a FictionHeader', () => {
    expect(wrapper.find(FictionHeader)).toHaveLength(1);
  });

  it('should render a FictionToolbar', () => {
    expect(wrapper.find(FictionToolbar)).toHaveLength(1);
  });

  it('should render a FictionBody', () => {
    expect(wrapper.find(FictionBody)).toHaveLength(1);
  });
});