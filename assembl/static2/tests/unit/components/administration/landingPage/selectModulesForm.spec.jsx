import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbSelectModulesForm } from '../../../../../js/app/components/administration/landingPage/selectModulesForm';
import { modulesById, modulesTypes } from './fakeData';

describe('DumbSelectModulesForm component', () => {
  it('should render a form to select the landing page modules', () => {
    const props = {
      hasErrors: false,
      modulesById: modulesById,
      moduleTypes: modulesTypes
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbSelectModulesForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});