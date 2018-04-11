import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbTextWithHeaderPage } from '../../../../js/app/components/common/textWithHeaderPage';
import '../../../helpers/setupTranslations';

describe('TextWithHeaderPage component', () => {
  it('should render the header with a title and a block of text', () => {
    const props = {
      headerTitle: 'Terms and Conditios',
      text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium dolore',
      debateData: { headerBackgroudUrl: 'fakeUrl' }
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbTextWithHeaderPage {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});