// @flow
import * as extractUtils from '../../../js/app/utils/extract';

describe('getExtractColor function', () => {
  const { getExtractColor } = extractUtils;
  it('should return the default color if the extract is not categorized by nature', () => {
    const actual = getExtractColor('', 'PUBLISHED', false);
    expect(actual).toEqual('#7ed321');
  });

  it('should return the color for actionable solution nature', () => {
    const actual = getExtractColor('Enum.actionable_solution', 'PUBLISHED', false);
    expect(actual).toEqual('#35C646');
  });

  it('should return the color for issue nature', () => {
    const actual = getExtractColor('Enum.issue', 'PUBLISHED', false);
    expect(actual).toEqual('#FF001F');
  });

  it('should return the color for knowledge nature', () => {
    const actual = getExtractColor('Enum.knowledge', 'PUBLISHED', false);
    expect(actual).toEqual('#BD10E0');
  });

  it('should return the color for example nature', () => {
    const actual = getExtractColor('Enum.example', 'PUBLISHED', false);
    expect(actual).toEqual('#FF9F00');
  });

  it('should return the color for concept nature', () => {
    const actual = getExtractColor('Enum.concept', 'PUBLISHED', false);
    expect(actual).toEqual('#00B6FF');
  });

  it('should return the color for argument nature', () => {
    const actual = getExtractColor('Enum.argument', 'PUBLISHED', false);
    expect(actual).toEqual('#FFEC00');
  });

  it('should return the color for cognitive bias nature', () => {
    const actual = getExtractColor('Enum.cognitive_bias', 'PUBLISHED', false);
    expect(actual).toEqual('#000000');
  });

  it('should return the color for an extract categorized by the robot', () => {
    const actual = getExtractColor('Enum.actionable_solution', 'SUBMITTED', true);
    expect(actual).toEqual('#FF9BB4');
  });

  it('should return the color for an extract categorized by the robot and validated by the admin', () => {
    const actual = getExtractColor('Enum.actionable_solution', 'PUBLISHED', true);
    expect(actual).toEqual('#B8E986');
  });
});