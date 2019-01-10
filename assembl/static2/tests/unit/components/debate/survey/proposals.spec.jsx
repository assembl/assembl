import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import Proposals from '../../../../../js/app/components/debate/survey/proposals';

const props = {
  hasPendingPosts: false,
  isPhaseCompleted: false,
  questionIndex: 1,
  questionId: 'question-885432',
  themeId: 'theme-187263',
  title: 'To be or not to be?',
  posts: [
    {
      node: {
        id: 'post-987654',
        originalLocale: 'en'
      }
    }
  ],
  nbPostsToShow: 3,
  phaseUrl: '/my/phase/url',
  questionsLength: 5
};

const renderer = new ShallowRenderer();

describe('Proposals component', () => {
  it('should display a list of proposals without posts', () => {
    const jsx = <Proposals {...props} posts={[]} />;
    renderer.render(jsx);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });

  it('should display a list of proposals without pending posts', () => {
    const jsx = <Proposals {...props} />;
    renderer.render(jsx);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });

  it('should display a list of proposals with pending posts', () => {
    const jsx = <Proposals {...props} hasPendingPosts />;
    renderer.render(jsx);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});