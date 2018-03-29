import { getCurrentPhaseIdentifier } from '../../../js/app/utils/timeline';

describe('getCurrentPhaseIdentifier timeline behavior', () => {
  it('should return last phase identifier when all phases closed', () => {
    const timeline = [
      {
        identifier: 'foo',
        start: '1900-01-01T02:00:00Z',
        end: '2000-01-01T00:00:00Z',
        title: { entries: [{ en: 'Foo' }] }
      },
      {
        identifier: 'bar',
        start: '2001-01-01T02:00:00Z',
        end: '2010-01-01T00:00:00Z',
        title: { entries: [{ en: 'Bar' }] }
      }
    ];
    const identifier = getCurrentPhaseIdentifier(timeline);
    expect(identifier).toEqual('bar');
  });
});