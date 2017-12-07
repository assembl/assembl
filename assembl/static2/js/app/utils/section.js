// @flow

const SEPARATOR = '.';

const CHARS = 'abcdefjhijklmnopqrstuvwxyz';

const LEN_CHARS = CHARS.length;

const LEN_NUMERIC = 2;

const defaultGenerator = (indexes: Array<number>): string => indexes.join(SEPARATOR) + SEPARATOR;

const alphanumeric = (indexes: Array<number>): string => {
  const alphanumericIndexes = indexes.map((i, level) => (level < LEN_NUMERIC ? level : CHARS[i % LEN_CHARS - 1]));
  return alphanumericIndexes.join(SEPARATOR) + SEPARATOR;
};

/**
 * @param {Array} An array of numbers. The order of each parent section
 * including the order of the section itself
 * @returns {String} Returns the string representing the index of a section.
 * @example
 *
 * ex1 (numeric index): indexes = [1, 1] => '1.1.' here we have LEN_NUMERIC items,
 * we generate the indexes as it is.
 *
 * ex2 (alphabetic index): indexes = [1, 1, 1] => 'a.' here we ignore the LEN_NUMERIC first items
 * and we replace others by chars because indexes.length > LEN_NUMERIC
 */
const alphanumericOr = (indexes: Array<number>): string => {
  const isAlpha = indexes.length > LEN_NUMERIC;
  if (isAlpha) {
    const indexesToDesplay = indexes.slice(LEN_NUMERIC);
    const alphanumericIndexes = indexesToDesplay.map(i => CHARS[i % LEN_CHARS - 1]);
    return alphanumericIndexes.join(SEPARATOR) + SEPARATOR;
  }
  return indexes.join(SEPARATOR) + SEPARATOR;
};

export const SECTION_INDEX_GENERATOR = {
  default: defaultGenerator,
  alphanumeric: alphanumeric,
  alphanumericOr: alphanumericOr
};