import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbPost } from '../../../../../../js/app/components/debate/common/post';

const handleEditClickSpy = jest.fn();
const refetchIdeaSpy = jest.fn();
export const postProps = {
  body: '<p>You can\'t index the port without programming the wireless HTTP program!</p>',
  bodyMimeType: 'text/*',
  borderLeftColor: 'red',
  contentLocale: 'fr',
  creationDate: '11/11/2011',
  data: {
    post: {
      creator: {
        userId: 'dannietreutel',
        displayName: 'Dannie Treutel'
      },
      id: 'XYZ333',
      modificationDate: '12/12/2012',
      sentimentCounts: 3,
      mySentiment: 'like',
      attachments: [],
      extracts: [],
      bodyEntries: [
        {
          localeCode: 'en',
          value: 'I\'ll bypass the online CSS bus, that should firewall the SAS monitor!'
        }
      ],
      publicationState: 'PUBLISHED',
      subjectEntries: [
        {
          localeCode: 'en',
          value: 'We need to hack the solid state HTTP alarm!'
        }
      ]
    }
  },
  debateData: {
    translationEnabled: true
  },
  editable: true,
  fullLevel: '0',
  id: 'XYZ333',
  ideaId: 'ABC123',
  identifier: 'thread',
  indirectIdeaContentLinks: [{ idea: { id: 'foo', title: 'Foo' } }],
  lang: 'fr',
  level: 1,
  modifiedSubject: <span>open-source Associate</span>,
  originalLocale: 'fr',
  publicationState: 'PUBLISHED',
  refetchIdea: refetchIdeaSpy,
  rowIndex: 0,
  subject: 'open-source Associate',
  handleEditClick: handleEditClickSpy,
  multiColumns: false,
  nuggetsManager: null,
  routerParams: {
    phase: 'thread',
    slug: '/debate/thread/XYZ333',
    themeId: 'VVV999'
  },
  numChildren: 3
};

describe('Post component', () => {
  it('should render a deleted post', () => {
    const props = {
      data: {
        post: {
          bodyEntries: [
            {
              localeCode: 'en',
              value: 'I\'ll bypass the online CSS bus, that should firewall the SAS monitor!'
            }
          ],
          id: 'XYZ123',
          publicationState: 'DELETED_BY_USER',
          subjectEntries: [
            {
              localeCode: 'en',
              value: 'We need to hack the solid state HTTP alarm!'
            }
          ]
        }
      }
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbPost {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  // TODO: find a way to set state or to call handleEditClick
  it('should render a form to edit the post if mode is edit');

  it('should render a PostView component and pass its props to it', () => {
    const props = postProps;
    const renderer = new ShallowRenderer();
    renderer.render(<DumbPost {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});