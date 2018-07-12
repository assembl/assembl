import * as step2 from '../../../../../js/app/components/administration/survey/step2';

describe('getTabsFromThemes function', () => {
  const { getTabsFromThemes } = step2;
  it('should return a list of tabs from a list of themes', () => {
    const themes = [
      {
        id: 'hello',
        title: {
          en: 'Hello',
          fr: 'Bonjour'
        }
      },
      {
        id: 'bye',
        title: {
          en: 'Bye',
          fr: 'Au-revoir'
        }
      }
    ];
    const expected = [{ id: 'hello', title: 'Hello' }, { id: 'bye', title: 'Bye' }];
    expect(getTabsFromThemes(themes, 'en')).toEqual(expected);
  });
});