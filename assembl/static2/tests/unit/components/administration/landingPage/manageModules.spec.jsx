import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbManageModules } from '../../../../../js/app/components/administration/landingPage/manageModules';
import { modulesByIdentifier } from './fakeData';

describe('ManageModules component', () => {
  it('should render a form to manage the landing page modules', () => {
    const props = {
      modulesByIdentifier: modulesByIdentifier
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbManageModules {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});