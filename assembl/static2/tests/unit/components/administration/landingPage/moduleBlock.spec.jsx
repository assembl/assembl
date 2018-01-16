import React from 'react';
import renderer from 'react-test-renderer';

import ModuleBlock from '../../../../../js/app/components/administration/landingPage/moduleBlock';

describe('ModuleBlock component', () => {
  it('should render a block that represents the module', () => {
    const props = {
      title: 'Header'
    };
    const component = renderer.create(<ModuleBlock {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});