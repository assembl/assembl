import React from 'react';
import renderer from 'react-test-renderer'; // eslint-disable-line

import Announcement, { createDoughnutElements } from '../../../../../js/app/components/debate/common/announcement';

describe('Announcement component', () => {
  const announcementContent = {
    body: '<p>Bonjour à tous</p>'
  };
  const fakePost1 = {
    __typename: 'PostEdge',
    node: {
      __typename: 'Post',
      id: '9706',
      parentId: 'null',
      creationDate: '2018-02-21T18:07:49.630164+00:00',
      publicationState: 'PUBLISHED',
      originalLocale: 'fr',
      sentimentCounts: { like: 2, disagree: 1, dontUnderstand: 0, moreInfo: 1, __typename: 'SentimentCounts' }
    }
  };
  const fakePost2 = {
    __typename: 'PostEdge',
    node: {
      __typename: 'Post',
      id: '9706',
      parentId: '9706',
      creationDate: '2018-02-21T18:08:14.590132+00:00',
      publicationState: 'PUBLISHED',
      originalLocale: 'fr',
      sentimentCounts: { like: 1, disagree: 1, dontUnderstand: 9, moreInfo: 0, __typename: 'SentimentCounts' }
    }
  };
  describe('<Announcement/> on a thread', () => {
    it('should render an announcement with the content associated to a thread idea', () => {
      const threadIdea = {
        id: '1234',
        messageColumns: [],
        messageViewOverride: null,
        numContributors: 2,
        numPosts: 2,
        posts: { edges: [fakePost1, fakePost2] },
        __typename: 'Idea'
      };
      const announcementProps = {
        announcementContent: announcementContent,
        idea: threadIdea,
        isMultiColumns: false
      };
      const component = renderer.create(<Announcement {...announcementProps} />);
      const tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
  describe('<Announcement /> on a multiColumns', () => {
    it('should render an announcement with the content associated to a multiColumns idea', () => {
      const positiveColumn = {
        color: 'green',
        columnSynthesis: {},
        index: 0,
        messageClassifier: 'positive',
        name: 'Positive',
        numPosts: 1,
        title: 'Positive',
        __typename: 'IdeaMessageColumn'
      };
      const negativeColumn = {
        color: 'red',
        columnSynthesis: {},
        index: 1,
        messageClassifier: 'negative',
        name: 'Negative',
        numPosts: 1,
        title: 'Negative',
        __typename: 'IdeaMessageColumn'
      };
      const messageColumns = [positiveColumn, negativeColumn];
      const multiColumnsIdea = {
        id: '12345',
        messageColumns: messageColumns,
        messageViewOverride: 'messageColumns',
        numContributors: 2,
        numPosts: 2,
        posts: {
          edges: [{ ...fakePost1, messageClassifier: 'positive' }, { ...fakePost2, messageClassifier: 'negative' }]
        }
      };
      const announcementProps = {
        announcementContent: announcementContent,
        idea: multiColumnsIdea,
        isMultiColumns: true
      };
      const component = renderer.create(<Announcement {...announcementProps} />);
      const tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
  describe('createDoughnutElements function', () => {
    it('should return an array of elements for a <StatisticDoughnut /> component', () => {
      const fakeSentimentCounts = {
        dontUnderstand: {
          type: 'DONT_UNDERSTAND',
          camelType: 'dontUnderstand',
          color: 'yellow',
          tooltip: {},
          count: 2,
          svgComponent: {
            defaultProps: {
              backgroundColor: '#ffffff',
              color: 'purple'
            }
          }
        },
        disagree: {
          type: 'DISAGREE',
          camelType: 'disagree',
          color: 'red',
          tooltip: {},
          count: 0,
          svgComponent: {
            defaultProps: {
              backgroundColor: '#ffffff',
              color: 'purple'
            }
          }
        },
        like: {
          type: 'LIKE',
          camelType: 'like',
          color: 'green',
          tooltip: {},
          count: 4,
          svgComponent: {
            defaultProps: {
              backgroundColor: '#ffffff',
              color: 'purple'
            }
          }
        },
        moreInfo: {
          type: 'MORE_INFO',
          camelType: 'moreinfo',
          color: 'purple',
          tooltip: {},
          count: 3,
          svgComponent: {
            defaultProps: {
              backgroundColor: '#ffffff',
              color: 'purple'
            }
          }
        }
      };
      const result = createDoughnutElements(fakeSentimentCounts);
      expect(result).toMatchSnapshot();
    });
  });
});