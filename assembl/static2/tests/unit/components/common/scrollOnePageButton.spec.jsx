import React from 'react';
import renderer from 'react-test-renderer';

import { DumbScrollOnePageButton } from '../../../../js/app/components/common/scrollOnePageButton';

describe('DumbScrollOnePageButton component', () => {
  it('should render a button to scroll one page down', () => {
    const component = renderer.create(<DumbScrollOnePageButton screenHeight={768} hidden={false} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a button to scroll one page down that is hidden', () => {
    const component = renderer.create(<DumbScrollOnePageButton screenHeight={768} hidden />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});