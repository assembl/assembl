import * as timelineUtils from '../../../js/app/utils/timeline';

describe('getCurrentPhaseData timeline behavior', () => {
  const { getCurrentPhaseData } = timelineUtils;
  it('should return last phase identifier when all phases closed', () => {
    const timeline = [
      {
        id: 'RGlzY3Vzc2lvblBoYXNlOjM=',
        identifier: 'foo',
        start: '1900-01-01T02:00:00Z',
        end: '2000-01-01T00:00:00Z',
        title: 'Foo'
      },
      {
        id: 'RGlzY3Vzc2lvblBoYXNlOjI=',
        identifier: 'bar',
        start: '2001-01-01T02:00:00Z',
        end: '2010-01-01T00:00:00Z',
        title: 'Bar'
      }
    ];
    const identifier = getCurrentPhaseData(timeline).currentPhaseIdentifier;
    expect(identifier).toEqual('bar');
  });
});

describe('getIsDebateStarted timeline behavior', () => {
  const { getIsDebateStarted } = timelineUtils;
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

describe('getPhaseById timeline behavior', () => {
  const { getPhaseById } = timelineUtils;
  it('should return the phase for the given id', () => {
    const timeline = [
      {
        id: 'RGlzY3Vzc2lvblBoYXNlOjM=',
        identifier: 'foo',
        start: '1900-01-01T02:00:00Z',
        end: '2000-01-01T00:00:00Z',
        title: 'Foo'
      },
      {
        id: 'RGlzY3Vzc2lvblBoYXNlOjI=',
        identifier: 'bar',
        start: '2001-01-01T02:00:00Z',
        end: '2010-01-01T00:00:00Z',
        title: 'Bar'
      }
    ];
    const phase = getPhaseById(timeline, 'RGlzY3Vzc2lvblBoYXNlOjM=');
    expect(phase).toEqual({
      id: 'RGlzY3Vzc2lvblBoYXNlOjM=',
      identifier: 'foo',
      start: '1900-01-01T02:00:00Z',
      end: '2000-01-01T00:00:00Z',
      title: 'Foo'
    });
  });
  it('should return undefined if phase not found', () => {
    const timeline = [];
    const phase = getPhaseById(timeline, 'unknown');
    expect(phase).toEqual(undefined);
  });
});

describe('getIsPhaseCompletedById behavior', () => {
  const { getIsPhaseCompletedById } = timelineUtils;
  const timeline = [
    {
      id: 'phase1',
      identifier: 'foo',
      start: '1900-01-01T02:00:00Z',
      end: '2000-01-01T00:00:00Z',
      title: 'Foo'
    },
    {
      id: 'phase2',
      identifier: 'bar',
      start: '2001-01-01T02:00:00Z',
      end: '2110-01-01T00:00:00Z',
      title: 'Bar'
    }
  ];

  it('should return true if the phase is completed', () => {
    const result = getIsPhaseCompletedById(timeline, 'phase1');
    expect(result).toBeTruthy();
  });

  it('should return false if the phase is not completed', () => {
    const result = getIsPhaseCompletedById(timeline, 'phase2');
    expect(result).toBeFalsy();
  });

  it('should throw an error if timeline is undefined', () => {
    expect(() => getIsPhaseCompletedById(undefined, 'phase1')).toThrowErrorMatchingSnapshot();
  });

  it('should throw an error if phaseId is undefined', () => {
    expect(() => getIsPhaseCompletedById(timeline, undefined)).toThrowErrorMatchingSnapshot();
  });

  it('should throw an error if there is no phase with this id in the timeline', () => {
    expect(() => getIsPhaseCompletedById(timeline, 'phase3')).toThrowErrorMatchingSnapshot();
  });
});