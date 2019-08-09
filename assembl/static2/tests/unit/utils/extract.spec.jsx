// @flow
import * as extractUtils from '../../../js/app/utils/extract';

describe('getExtractColor function', () => {
  const { getExtractColor } = extractUtils;
  it('should return the default color if the extract is not categorized by nature', () => {
    const actual = getExtractColor('', 'PUBLISHED', false);
    expect(actual.background).toEqual('#7ed321');
    expect(actual.text).toEqual('#FFFFFF');
  });

  it('should return the color for actionable solution nature', () => {
    const actual = getExtractColor('Enum.actionable_solution', 'PUBLISHED', false);
    expect(actual.background).toEqual('#35C646');
    expect(actual.text).toEqual('#FFFFFF');
  });

  it('should return the color for issue nature', () => {
    const actual = getExtractColor('Enum.issue', 'PUBLISHED', false);
    expect(actual.background).toEqual('#FF001F');
    expect(actual.text).toEqual('#FFFFFF');
  });

  it('should return the color for knowledge nature', () => {
    const actual = getExtractColor('Enum.knowledge', 'PUBLISHED', false);
    expect(actual.background).toEqual('#BD10E0');
    expect(actual.text).toEqual('#FFFFFF');
  });

  it('should return the color for example nature', () => {
    const actual = getExtractColor('Enum.example', 'PUBLISHED', false);
    expect(actual.background).toEqual('#FF9F00');
    expect(actual.text).toEqual('#FFFFFF');
  });

  it('should return the color for concept nature', () => {
    const actual = getExtractColor('Enum.concept', 'PUBLISHED', false);
    expect(actual.background).toEqual('#00B6FF');
    expect(actual.text).toEqual('#FFFFFF');
  });

  it('should return the color for argument nature', () => {
    const actual = getExtractColor('Enum.argument', 'PUBLISHED', false);
    expect(actual.background).toEqual('#FFEC00');
    expect(actual.text).toEqual('#FFFFFF');
  });

  it('should return the color for cognitive bias nature', () => {
    const actual = getExtractColor('Enum.cognitive_bias', 'PUBLISHED', false);
    expect(actual.background).toEqual('#000000');
    expect(actual.text).toEqual('#FFFFFF');
  });

  it('should return the color for an extract categorized by the robot', () => {
    const actual = getExtractColor('Enum.actionable_solution', 'SUBMITTED', true);
    expect(actual.background).toEqual('#FF9BB4');
    expect(actual.text).toEqual('#FFFFFF');
  });

  it('should return the color for an extract categorized by the robot and validated by the admin', () => {
    const actual = getExtractColor('Enum.actionable_solution', 'PUBLISHED', true);
    expect(actual.background).toEqual('#B8E986');
    expect(actual.text).toEqual('#FFFFFF');
  });
});