// eslint-disable-next-line max-len
import { addEnumSuffixToModuleTitles } from '../../../../../js/app/components/administration/landingPage/addEnumSuffixToModuleTitles';

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