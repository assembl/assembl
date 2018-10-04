import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbManageModules } from '../../../../../js/app/components/administration/landingPage/manageModules';
import { enabledModules, moduleTypes, modulesById } from './fakeData';

describe('ManageModules component', () => {
  it('should render a form to manage the landing page modules', () => {
    const moveModuleDownSpy = jest.fn(() => {});
    const moveModuleUpSpy = jest.fn(() => {});
    const toggleModuleSpy = jest.fn(() => {});
    const createModuleSpy = jest.fn(() => {});
    const locale = 'fr';
    const props = {
      enabledModules: enabledModules,
      moduleTypes: moduleTypes,
      modulesById: modulesById,
      moveModuleDown: moveModuleDownSpy,
      moveModuleUp: moveModuleUpSpy,
      toggleModule: toggleModuleSpy,
      createModule: createModuleSpy,
      locale: locale
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbManageModules {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});