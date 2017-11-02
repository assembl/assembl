// @flow

const SEPARATOR = '.';

const CHARS = 'abcdefjhijklmnopqrstuvwxyz';

const LEN_CHARS = CHARS.length;

const LEN_NUMERIC = 2;

const defaultGenerator = (indexes: Array<number>): string => {
  return indexes.join(SEPARATOR) + SEPARATOR;
};

const alphanumeric = (indexes: Array<number>): string => {
  const alphanumericIndexes = indexes.map((i, level) => {
    return level < LEN_NUMERIC ? level : CHARS[i % LEN_CHARS - 1];
  });
  return alphanumericIndexes.join(SEPARATOR) + SEPARATOR;
};

const alphanumericOr = (indexes: Array<number>): string => {
  const isAlpha = indexes.length > LEN_NUMERIC;
  if (isAlpha) {
    const indexesToDesplay = indexes.slice(LEN_NUMERIC);
    const alphanumericIndexes = indexesToDesplay.map((i) => {
      return CHARS[i % LEN_CHARS - 1];
    });
    return alphanumericIndexes.join(SEPARATOR) + SEPARATOR;
  }
  return indexes.join(SEPARATOR) + SEPARATOR;
};

export const SECTION_INDEX_GENERATOR = {
  default: defaultGenerator,
  alphanumeric: alphanumeric,
  alphanumericOr: alphanumericOr
};