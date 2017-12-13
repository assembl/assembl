import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import PostBody from '../../../../../../js/app/components/debate/common/post/postBody';

describe('PostBody component', () => {
  it('should render a post body', () => {
    const bodyDivRefSpy = jest.fn();
    const props = {
      body: '<p>You can\'t index the port without programming the wireless HTTP program!</p>',
      bodyDivRef: bodyDivRefSpy,
      bodyMimeType: 'text/*',
      contentLocale: 'fr',
      id: 'XYZ333',
      lang: 'fr',
      subject: <span>open-source Associate</span>,
      originalLocale: 'en',
      translate: true,
      translationEnabled: true
    };
    const renderer = new ShallowRenderer();
    renderer.render(<PostBody {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});