import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import {
  DumbPostBody,
  Html,
  postBodyReplacementComponents
} from '../../../../../../js/app/components/debate/common/post/postBody';
import * as fakeData from '../../../harvesting/fakeData';

describe('PostBody component', () => {
  it('should render a post body', () => {
    const bodyDivRefSpy = jest.fn();
    const props = {
      body: '<p>You can\'t index the port without programming the wireless HTTP program!</p>',
      bodyDivRef: bodyDivRefSpy,
      bodyMimeType: 'text/*',
      contentLocale: 'fr',
      extracts: [],
      id: 'XYZ333',
      dbId: 124,
      lang: 'fr',
      subject: <span>open-source Associate</span>,
      originalLocale: 'en',
      translate: true,
      translationEnabled: true,
      connectedUserId: null
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbPostBody {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should render a html body', () => {
    const { extracts } = fakeData;
    const props = {
      extracts: extracts,
      rawHtml:
        'You can\'t index <a href="url">the port</a> without <annotation data-state="pending" ' +
        'id="annotationId">programming</annotation> the wireless HTTP program! <iframe src="iframe-src"></iframe>',
      divRef: () => {},
      dbId: '3059',
      replacementComponents: postBodyReplacementComponents(),
      contentLocale: 'fr'
    };
    const renderer = new ShallowRenderer();
    renderer.render(<Html {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});