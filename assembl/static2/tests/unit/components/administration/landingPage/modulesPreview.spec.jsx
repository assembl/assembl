import React from 'react';
import renderer from 'react-test-renderer';

import ModulesPreview from '../../../../../js/app/components/administration/landingPage/modulesPreview';
import { enabledModulesInOrder } from './fakeData';

describe('ModulesPreview component', () => {
  it('should render a preview of the enabled modules', () => {
    const props = {
      modules: enabledModulesInOrder
    };
    const component = renderer.create(<ModulesPreview {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});