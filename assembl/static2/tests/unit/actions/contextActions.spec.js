import * as actions from '../../../js/app/actions/contextActions';

describe('Context actions', () => {
  describe('toggleHarvesting action', () => {
    const { toggleHarvesting } = actions;
    it('should return a TOGGLE_HARVESTING action type', () => {
      const expected = {
        type: 'TOGGLE_HARVESTING'
      };
      const actual = toggleHarvesting();
      expect(actual).toEqual(expected);
    });
  });
});