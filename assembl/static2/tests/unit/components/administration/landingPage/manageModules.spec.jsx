import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import {
  DumbManageModules,
  addEnumSuffixToModuleTitles,
  sortByTitle
} from '../../../../../js/app/components/administration/landingPage/manageModules';
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

describe('addEnumSuffixToModuleTitles function', () => {
  it('should return the same array if there is no duplicate', () => {
    const fakeModules = [
      { moduleType: { title: 'lorem' } },
      { moduleType: { title: 'ipsum' } },
      { moduleType: { title: 'foo' } }
    ];
    expect(addEnumSuffixToModuleTitles(fakeModules)).toEqual(fakeModules);
  });
  it('should return an array of modules with count added on the title of duplicates', () => {
    const fakeModules = [
      { moduleType: { title: 'lorem' } },
      { moduleType: { title: 'lorem' } },
      { moduleType: { title: 'ipsum' } },
      { moduleType: { title: 'foo' } }
    ];
    const actual = addEnumSuffixToModuleTitles(fakeModules);
    const expected = [
      { moduleType: { title: 'lorem 1' } },
      { moduleType: { title: 'lorem 2' } },
      { moduleType: { title: 'ipsum' } },
      { moduleType: { title: 'foo' } }
    ];
    expect(actual).toEqual(expected);
  });
  it('should return an array of modules with count added on the title of different duplicates', () => {
    const fakeModules = [
      { moduleType: { title: 'ipsum' } },
      { moduleType: { title: 'lorem' } },
      { moduleType: { title: 'lorem' } },
      { moduleType: { title: 'lorem' } },
      { moduleType: { title: 'ipsum' } },
      {
        moduleType: { title: 'foo' }
      }
    ];
    const actual = addEnumSuffixToModuleTitles(fakeModules);
    const expected = [
      { moduleType: { title: 'ipsum 1' } },
      { moduleType: { title: 'lorem 1' } },
      { moduleType: { title: 'lorem 2' } },
      { moduleType: { title: 'lorem 3' } },
      { moduleType: { title: 'ipsum 2' } },
      {
        moduleType: { title: 'foo' }
      }
    ];
    expect(actual).toEqual(expected);
  });
});

describe('sortByTitle function', () => {
  it('should return an array of modules sorted on title', () => {
    const fakeModulesTypes = [{ title: 'lorem 1' }, { title: 'ipsum' }, { title: 'lorem 2' }, { title: 'foo' }];
    const actual = sortByTitle(fakeModulesTypes);
    const expected = [{ title: 'foo' }, { title: 'ipsum' }, { title: 'lorem 1' }, { title: 'lorem 2' }];
    expect(actual).toEqual(expected);
  });
});