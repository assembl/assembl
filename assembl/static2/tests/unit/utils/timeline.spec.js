import { getCurrentPhaseIdentifier, getIsDebateStarted } from '../../../js/app/utils/timeline';

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

  it('should return that the debate is not started if timeline is empty', () => {
    const timeline = [];
    const isDebateStarted = getIsDebateStarted(timeline);
    expect(isDebateStarted).toEqual(false);
  });

  it('should return that the debate is not started if all phases are not started', () => {
    const timeline = [
      { start: '2032-08-15T20:00:00+00:00' },
      { start: '2032-09-16T09:00:00+00:00' },
      { start: '2032-10-01T00:00:00+00:00' }
    ];
    const isDebateStarted = getIsDebateStarted(timeline);
    expect(isDebateStarted).toEqual(false);
  });

  it('should return that the debate is started if at least a phase is started', () => {
    const timeline = [
      { start: '2016-08-15T20:00:00+00:00' },
      { start: '2032-09-16T09:00:00+00:00' },
      { start: '2032-10-01T00:00:00+00:00' }
    ];
    const isDebateStarted = getIsDebateStarted(timeline);
    expect(isDebateStarted).toEqual(true);
  });
});