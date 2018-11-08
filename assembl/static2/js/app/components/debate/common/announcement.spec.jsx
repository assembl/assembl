import React from 'react';
import renderer from 'react-test-renderer'; // eslint-disable-line

import Announcement from '../../../../../js/app/components/debate/common/announcement';

describe('Announcement component', () => {
  const announcementContent = {
    body: '<p>Bonjour à tous</p>',
    title: 'Titre de l\'annonce',
    __typename: 'IdeaAnnouncement'
  };
  describe('<Announcement/> on a thread', () => {
    it('should render an announcement with a thread idea', () => {
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
});