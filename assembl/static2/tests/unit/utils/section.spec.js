import { SECTION_INDEX_GENERATOR } from '../../../js/app/utils/section';

describe('Section index generator', () => {
  describe('alphanumericOr generator', () => {
    it('should return numeric index', () => {
      const expected = '1.2.';
      const actual = SECTION_INDEX_GENERATOR.alphanumericOr([1, 2]);
      expect(actual).toEqual(expected);
    });
    it('should return alphabetic index', () => {
      const expected = 'c.';
      const actual = SECTION_INDEX_GENERATOR.alphanumericOr([1, 2, 3]);
      expect(actual).toEqual(expected);
    });
  });
});