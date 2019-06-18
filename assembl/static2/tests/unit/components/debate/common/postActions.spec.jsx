// @flow
import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { OverlayTrigger } from 'react-bootstrap';

import { PostActions } from '../../../../../js/app/components/debate/common/postActions';
import Sentiments from '../../../../../js/app/components/debate/common/sentiments';
import type { Props } from '../../../../../js/app/components/debate/common/postActions';

configure({ adapter: new Adapter() });

const props: Props = {
  timeline: [{ id: '654321' }],
  isPending: false,
  isMultiColumns: false,
  isPendingPostForModerator: false,
  isDebateModerated: false,
  client: jest.fn(),
  creatorUserId: '1234567890',
  debateData: {
    chatbot: {
      link: 'foo',
      name: 'barbara',
      titleEntries: {}
    },
    chatframe: {
      src: 'foo'
    },
    customHtmlCodeLandingPage: null,
    customHtmlCodeRegistrationPage: null,
    dates: {
      endDate: '2018-03-31',
      startDate: '2017-09-07'
    },
    headerBackgroundUrl: 'foo',
    headerLogoUrl: null,
    helpUrl: '',
    identifier: 'thread',
    introduction: {
      titleEntries: [],
      images: {}
    },
    logo: 'foo',
    objectives: {
      titleEntries: [],
      descriptionEntries: [],
      images: {
        img1Url: 'foo',
        img2Url: 'foo'
      }
    },
    partners: [],
    slug: 'foo',
    socialMedias: [],
    termsOfUseUrl: null,
    timeline: [],
    topic: {
      titleEntries: []
    },
    translationEnabled: true,
    twitter: {
      backgroundImageUrl: 'foo',
      id: '987654'
    },
    useSocialMedia: false,
    video: {
      descriptionEntriesTop: null,
      titleEntries: null,
      videoUrl: 'foo'
    },
    titleEntries: []
  },
  editable: true,
  handleEditClick: jest.fn(),
  phaseId: '654321',
  mySentiment: 'LIKE',
  numChildren: 10,
  postId: '987654',
  routerParams: {
    phase: 'thread',
    slug: 'foo',
    themeId: '974532'
  },
  screenWidth: 600,
  sentimentCounts: {
    disagree: 0,
    dontUnderstand: 0,
    like: 0,
    moreInfo: 0
  }
};

jest.mock('../../../../../js/app/utils/globalFunctions', () => ({
  getConnectedUserId: jest.fn(() => '1234567890')
}));
jest.mock('../../../../../js/app/utils/timeline', () => ({
  getIsPhaseCompletedById: jest.fn(() => false)
}));
jest.mock('../../../../../js/app/utils/permissions', () => ({ connectedUserCan: jest.fn(() => true) }));

describe('<PostActions /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<PostActions {...props} />);
  });

  it('should render 1 sentiments component', () => {
    expect(wrapper.find(Sentiments)).toHaveLength(1);
  });

  it('should render 1 overlay when the total of sentiments is greater than 0', () => {
    wrapper.setProps({
      sentimentCounts: {
        disagree: 1,
        dontUnderstand: 1,
        like: 1,
        moreInfo: 1
      }
    });
    expect(wrapper.find(OverlayTrigger)).toHaveLength(1);
  });

  it('should not render overlays and sentiments component if debateData is null', () => {
    wrapper.setProps({ debateData: null });
    // expect(wrapper.find(OverlayTrigger)).toHaveLength(0);
    expect(wrapper.find(Sentiments)).toHaveLength(0);
  });
});