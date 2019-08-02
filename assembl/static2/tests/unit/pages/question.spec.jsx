import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbQuestion } from '../../../js/app/pages/question';

describe('Question page', () => {
  const props = {
    imgUrl: 'https://foo.bar/umgurl',
    isModerating: false,
    timeline: [
      {
        id: 'phaseFoo',
        title: 'Survey',
        identifier: 'survey',
        start: '2018-09-27T20:00:00+00:00',
        end: '2100-01-27T20:00:00+00:00'
      }
    ],
    title: 'Foo',
    thematicTitle: 'Bar',
    thematicId: 'ThematicId',
    numPosts: 2,
    numContributors: 2,
    totalSentiments: 1,
    params: {
      questionIndex: 'Index',
      questionId: 'FooInd',
      phase: 'survey',
      slug: 'FooSlug'
    },
    phaseId: 'phaseFoo',
    questionFilter: {
      postsFiltersStatus: {
        onlyMyPosts: false
      },
      postsOrderPolicy: {
        graphqlPostsOrder: 'chronological'
      }
    }
  };

  it('should display a question', () => {
    const renderer = new ShallowRenderer();
    renderer.render(<DumbQuestion {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });

  it('should display a question in moderation context', () => {
    const renderer = new ShallowRenderer();
    renderer.render(<DumbQuestion {...props} isModerating />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});