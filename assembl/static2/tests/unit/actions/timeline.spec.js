// @flow
import * as actions from '../../../js/app/actions/timelineActions';
import * as actionTypes from '../../../js/app/actions/actionTypes';

describe('Timeline actions', () => {
  describe('updateTimeline action', () => {
    const { updateTimeline } = actions;

    it('should return a UPDATE_TIMELINE action type', () => {
      const actual = updateTimeline('a timeline string');
      const expected = {
        timeline: 'a timeline string',
        type: actionTypes.UPDATE_TIMELINE
      };
      expect(actual).toEqual(expected);
    });
  });
});