import deepen from '../../../js/app/utils/deepen';

describe('This test concerns the deepen function', () => {
  it('transform an object with dotted keys into nested objects', () => {
    const result = deepen({ 'ab.cd.e': 'foo', 'ab.cd.f': 'bar', 'ab.g': 'foo2' });
    expect(result).toEqual({ ab: { cd: { e: 'foo', f: 'bar' }, g: 'foo2' } });
  });
});