import React from 'react';
import renderer from 'react-test-renderer';
import { SearchkitManager, SearchkitProvider } from 'searchkit';
import { Router } from 'react-router';

import * as search from '../../../js/app/components/search';

jest.mock('react-router');
jest.mock('../../../js/app/router');

const fakeBemBlocks = {
  container: name => name,
  item: name => ({
    mix: otherName => (name ? `div__${name}__${otherName}` : `div__${otherName}`)
  })
};

describe('Hits components', () => {
  let context;
  let searchkit;

  beforeEach(() => {
    context = {
      router: new Router()
    };
    searchkit = SearchkitManager.mock();
  });

  afterEach(() => {
    context = null;
    searchkit = null;
  });

  describe('PostHit component', () => {
    const { PostHit } = search;

    it('should render a post hit', () => {
      const props = {
        bemBlocks: fakeBemBlocks,
        locale: 'en',
        result: {
          _type: 'post',
          _source: {
            creation_date: '2018-08-08',
            creator_id: 'foo',
            creator_name: 'Paxton Pouros',
            subject_en: 'We need to quantify the optical HTTP panel!',
            body_en: 'We need to connect the multi-byte SQL interface!',
            idea_id: 'fakeIdeaId',
            post_id: 'fakePostId',
            sentiment_counts: {
              like: 2,
              disagree: 3,
              dont_understand: 3,
              more_info: 1
            }
          }
        }
      };

      const component = renderer.create(
        <SearchkitProvider searchkit={searchkit}>
          <PostHit {...props} />
        </SearchkitProvider>,
        {
          context: context
        }
      );
      const tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('DumbExtractHit component', () => {
    const { DumbExtractHit } = search;
    it('should render an extract hit', () => {
      const props = {
        bemBlocks: fakeBemBlocks,
        locale: 'en',
        result: {
          _type: 'extract',
          _source: {
            creation_date: '2018-08-08',
            creator_id: 'foo',
            creator_name: 'Jewell Pouros',
            subject_en: 'We need to quantify the optical HTTP panel!',
            body: 'We need to connect the multi-byte SQL interface!'
          }
        }
      };

      const component = renderer.create(
        <SearchkitProvider searchkit={searchkit}>
          <DumbExtractHit {...props} />
        </SearchkitProvider>,
        {
          context: context
        }
      );
      const tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});