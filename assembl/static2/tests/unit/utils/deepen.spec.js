import deepen from '../../../js/app/utils/deepen';
import nestedObjects2messages from '../../../scripts/translations2messages';

describe('This test concerns the deepen function', () => {
  it('transform an object with dotted keys into nested objects', () => {
    const result = deepen({ 'ab.cd.e': 'foo', 'ab.cd.f': 'bar', 'ab.g': 'foo2' });
    expect(result).toEqual({ ab: { cd: { e: 'foo', f: 'bar' }, g: 'foo2' } });
  });
});

describe('This test concerns the nestedObjects2messages function used in the translations2messages script', () => {
  it('transform nested objects to the messages.json format used by react-intl-po', () => {
    const result = nestedObjects2messages({ ab: { cd: { e: 'foo', f: 'bar' }, g: 'foo2' } });
    expect(result).toEqual([
      { defaultMessage: 'foo', id: 'ab.cd.e' },
      { defaultMessage: 'bar', id: 'ab.cd.f' },
      { defaultMessage: 'foo2', id: 'ab.g' }
    ]);
  });
});