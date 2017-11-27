import React from 'react';
import renderer from 'react-test-renderer';

import { ScrollOnePageButton } from '../../../../js/app/components/common/scrollOnePageButton';

describe('ScrollOnePageButton component', () => {
  it('should render a button to scroll one page down', () => {
    const component = renderer.create(<ScrollOnePageButton screenHeight={768} hidden={false} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a button to scroll one page down that is hidden', () => {
    const component = renderer.create(<ScrollOnePageButton screenHeight={768} hidden />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});