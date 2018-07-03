export const TimelineReducer = (state = 'fr', action) => {
  switch (action.type) {
  case 'UPDATE_TIMELINE':
    return action.timeline;
  default:
    return state;
  }
};

export default TimelineReducer;