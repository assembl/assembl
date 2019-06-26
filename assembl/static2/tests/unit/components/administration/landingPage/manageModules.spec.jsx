import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbManageModules, sortByTitle } from '../../../../../js/app/components/administration/landingPage/manageModules';
import { modules, moduleTypes, modulesById } from './fakeData';

describe('ManageModules component', () => {
  it('should render a preview to manage the landing page modules', () => {
    const moveModuleDownSpy = jest.fn(() => {});
    const moveModuleUpSpy = jest.fn(() => {});
    const toggleModuleSpy = jest.fn(() => {});
    const createModuleSpy = jest.fn(() => {});
    const locale = 'fr';
    const props = {
      modules: modules,
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

describe('sortByTitle function', () => {
  it('should return an array of modules sorted on title', () => {
    const fakeModulesTypes = [
      { title: 'lorem 1', identifier: 'TEXT' },
      { title: 'ipsum', identifier: 'TEXT' },
      { title: 'lorem 2', identifier: 'HEADER' },
      { title: 'foo', identifier: 'FOOTER' }
    ];
    const actual = sortByTitle(fakeModulesTypes);
    const expected = [
      { title: 'lorem 2', identifier: 'HEADER' },
      { title: 'ipsum', identifier: 'TEXT' },
      { title: 'lorem 1', identifier: 'TEXT' },
      { title: 'foo', identifier: 'FOOTER' }
    ];
    expect(actual).toEqual(expected);
  });
});