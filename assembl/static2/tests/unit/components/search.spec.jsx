import React from 'react';
import renderer from 'react-test-renderer';
import { ArrayState, SearchkitManager, SearchkitProvider, StatefulAccessor } from 'searchkit';
import { Router } from 'react-router';

import * as search from '../../../js/app/components/search';

jest.mock('react-router');
jest.mock('../../../js/app/router');

class CreatorIdAccessor extends StatefulAccessor {
  state = new ArrayState();
}

const fakeBemBlocks = {
  container: name => name,
  item: (name) => {
    if (name) {
      return name.toUpperCase();
    }

    // no arg
    return {
      mix: otherName => (name ? `div__${name}__${otherName}` : `div__${otherName}`)
    };
  }
};

const collapseSearchSpy = jest.fn();

describe('Hits components', () => {
  let context;
  let searchkit;

  beforeEach(() => {
    context = {
      router: new Router()
    };
    searchkit = SearchkitManager.mock();
    const creatorIdAccessor = new CreatorIdAccessor('creator_id');
    searchkit.addAccessor(creatorIdAccessor);
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
            idea_id: ['fakeIdeaId', 'otherFakeIdeaId'],
            phase_id: 1,
            phase_identifier: 'thread',
            id: 'fakePostId',
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

  describe('IdeaHit component', () => {
    const { IdeaHit } = search;

    it('should render an idea hit', () => {
      const props = {
        bemBlocks: fakeBemBlocks,
        collapseSearch: collapseSearchSpy,
        locale: 'en',
        result: {
          highlight: {
            description_en: 'molestias necessitatibus'
          },
          _type: 'idea',
          _source: {
            title_en: 'Rerum asperiores inventore veniam',
            description_en: 'Mollitia quis perspiciatis ut nobis molestias necessitatibus pariatur impedit ut.',
            announcement_title_en: 'You can\'t reboot the circuit without parsing the wireless GB feed!',
            announcement_body_en: 'backing up the microchip won\'t do anything!',
            num_posts: 544,
            num_contributors: 42,
            id: 456,
            phase_id: 1,
            phase_identifier: 'thread'
          }
        }
      };

      const component = renderer.create(
        <SearchkitProvider searchkit={searchkit}>
          <IdeaHit {...props} />
        </SearchkitProvider>,
        {
          context: context
        }
      );
      const tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('SynthesisHit component', () => {
    const { SynthesisHit } = search;

    it('should render a synthesis hit', () => {
      const props = {
        bemBlocks: fakeBemBlocks,
        collapseSearch: collapseSearchSpy,
        locale: 'en',
        result: {
          _type: 'synthesis',
          _source: {
            creation_date: '2018-08-08',
            creator_id: 'foo',
            creator_name: 'Annabelle Olson',
            ideas_en: 'First idea Second idea',
            subject_en: 'Maybe it will transmit the optical application!!',
            introduction_en: 'I\'ll bypass the online PCI card, that should matrix the USB firewall!',
            conclusion_en: 'Try to parse the COM card, maybe it will calculate the neural monitor!'
          }
        }
      };

      const component = renderer.create(
        <SearchkitProvider searchkit={searchkit}>
          <SynthesisHit {...props} />
        </SearchkitProvider>,
        {
          context: context
        }
      );
      const tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('UserHit component', () => {
    const { UserHit } = search;

    it('should render a user hit', () => {
      const props = {
        bemBlocks: fakeBemBlocks,
        collapseSearch: collapseSearchSpy,
        locale: 'en',
        result: {
          highlight: {
            name: 'Gertrude Effertz'
          },
          _type: 'user',
          _source: {
            id: 'SD83SG',
            num_posts: 33,
            creation_date: '2016-07-07'
          }
        }
      };

      const component = renderer.create(
        <SearchkitProvider searchkit={searchkit}>
          <UserHit {...props} />
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
            body: 'We need to connect the multi-byte SQL interface!',
            idea_id: 'fakeIdeaId',
            phase_id: 1,
            phase_identifier: 'thread',
            post_id: 'fakePostId'
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