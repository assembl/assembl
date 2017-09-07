import * as administration from '../../../js/app/pages/administration';

describe('convertVideoDescriptions function', () => {
  const { convertVideoDescriptions } = administration;
  it('should convert video descriptions to raw content state', () => {
    const thematics = [
      {
        id: 'my-thematic',
        titleEntries: [{ locale: 'en', value: 'My thematic' }],
        video: {
          descriptionEntriesBottom: [],
          descriptionEntriesSide: [],
          descriptionEntriesTop: [
            { locale: 'en', value: 'My top description' },
            { locale: 'fr', value: 'Ma description en haut' }
          ]
        }
      }
    ];
    const actual = convertVideoDescriptions(thematics);
    const myThematic = actual[0];
    expect(myThematic.video.descriptionEntriesBottom).toEqual([]);
    expect(myThematic.video.descriptionEntriesSide).toEqual([]);
    const descTop = myThematic.video.descriptionEntriesTop;
    expect(descTop[0].locale).toEqual('en');
    expect(descTop[0].value.blocks[0].text).toEqual('My top description');
    expect(descTop[1].locale).toEqual('fr');
    expect(descTop[1].value.blocks[0].type).toEqual('unstyled');
  });

  it('should do nothing if video is null', () => {
    const thematics = [
      {
        id: 'my-thematic',
        titleEntries: [{ locale: 'en', value: 'My thematic' }],
        video: null
      }
    ];
    const actual = convertVideoDescriptions(thematics);
    expect(actual).toEqual(thematics);
  });
});