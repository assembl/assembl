import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import {
  DumbManageModules,
  addCountSuffix,
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

describe('addCountSuffix function', () => {
  it('should return the same array if there is no duplicate', () => {
    const fakeModules = [{ title: 'lorem' }, { title: 'ipsum' }, { title: 'foo' }];
    expect(addCountSuffix(fakeModules)).toEqual(fakeModules);
  });
  it('should return an array of modules with count added on the title of duplicates', () => {
    const fakeModules = [{ title: 'lorem' }, { title: 'lorem' }, { title: 'ipsum' }, { title: 'foo' }];
    const actual = addCountSuffix(fakeModules);
    const expected = [{ title: 'lorem 1' }, { title: 'lorem 2' }, { title: 'ipsum' }, { title: 'foo' }];
    expect(actual).toEqual(expected);
  });
  it('should return an array of modules with count added on the title of different duplicates', () => {
    const fakeModules = [
      { title: 'ipsum' },
      { title: 'lorem' },
      { title: 'lorem' },
      { title: 'lorem' },
      { title: 'ipsum' },
      { title: 'foo' }
    ];
    const actual = addCountSuffix(fakeModules);
    const expected = [
      { title: 'ipsum 1' },
      { title: 'lorem 1' },
      { title: 'lorem 2' },
      { title: 'lorem 3' },
      { title: 'ipsum 2' },
      { title: 'foo' }
    ];
    expect(actual).toEqual(expected);
  });
});

describe('sortByTitle function', () => {
  it('should return an array of modules sorted on title', () => {
    const fakeModules = [{ title: 'lorem 1' }, { title: 'ipsum' }, { title: 'lorem 2' }, { title: 'foo' }];
    const actual = sortByTitle(fakeModules);
    const expected = [{ title: 'foo' }, { title: 'ipsum' }, { title: 'lorem 1' }, { title: 'lorem 2' }];
    expect(actual).toEqual(expected);
  });
});