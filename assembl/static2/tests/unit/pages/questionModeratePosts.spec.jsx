import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import QuestionModeratePosts from '../../../js/app/pages/questionModeratePosts';
import { connectedUserIsModerator } from '../../../js/app/utils/permissions';
import { get, goTo } from '../../../js/app/utils/routeMap';

configure({ adapter: new Adapter() });

jest.mock('../../../js/app/utils/permissions');
jest.mock('../../../js/app/utils/routeMap');

describe('QuestionModeratePosts page', () => {
  const props = {
    imgUrl: 'https://foo.bar/umgurl',
    isModerating: true,
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
      slug: 'FooSlug'
    },
    phaseId: 'phaseFoo'
  };

  describe('componentDidMount method', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should redirect to unauthorized if connected user is not moderator', () => {
      connectedUserIsModerator.mockImplementation(() => false);
      shallow(<QuestionModeratePosts {...props} />);
      expect(get).toHaveBeenCalledWith('unauthorizedAdministration', { slug: 'FooSlug' });
      expect(goTo).toHaveBeenCalled();
    });

    it('should not redirect to unauthorized if connected user is moderator', () => {
      connectedUserIsModerator.mockImplementation(() => true);
      shallow(<QuestionModeratePosts {...props} />);
      expect(get).not.toHaveBeenCalled();
      expect(goTo).not.toHaveBeenCalled();
    });
  });

  it('should display a question', () => {
    const renderer = new ShallowRenderer();
    renderer.render(<QuestionModeratePosts {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});