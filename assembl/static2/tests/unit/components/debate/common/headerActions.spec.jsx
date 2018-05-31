import React from 'react';
import renderer from 'react-test-renderer';

import HeaderActions from '../../../../../js/app/components/debate/common/headerActions';

describe('headerActions component', () => {
  it('should render a headerActions component', () => {
    const props = {
      routerParams: {
        slug: 'ai-debate',
        phase: 'thread',
        themeId: '1234'
      },
      ideaId: '12345678',
      useSocialMedia: true
    };
    const component = renderer.create(<HeaderActions {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});