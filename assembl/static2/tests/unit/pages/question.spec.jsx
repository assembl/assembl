import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbQuestion } from '../../../js/app/pages/question';

describe('Question page', () => {
  it('should match Question with data snapshot', () => {
    const props = {
      imgUrl: 'https://foo.bar/umgurl',
      title: 'Foo',
      thematicTitle: 'Bar',
      thematicId: 'ThematicId',
      params: {
        questionIndex: 'Index',
        questionId: 'FooInd'
      },
      slug: 'FooSlug'
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbQuestion {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});