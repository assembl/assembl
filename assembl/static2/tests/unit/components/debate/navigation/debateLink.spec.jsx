import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import DebateLink from '../../../../../js/app/components/debate/navigation/debateLink';
import '../../../../helpers/setupTranslations';

describe('DebateLink component', () => {
  it('should match the DebateLink', () => {
    const props = {
      identifier: 'survey',
      children: <span>Debate</span>,
      to: 'https://foo.bar',
      className: 'debate-class',
      activeClassName: 'debate-class-active',
      dataText: 'Debate'
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DebateLink {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
  it('should match the DebateLink (small screen)', () => {
    const props = {
      identifier: 'survey',
      children: <span>Debate</span>,
      to: 'https://foo.bar',
      className: 'debate-class',
      activeClassName: 'debate-class-active',
      dataText: 'Debate',
      screenTooSmall: true
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DebateLink {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});