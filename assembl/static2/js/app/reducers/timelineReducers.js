// use null as default state to indicate the timeline is not loaded yet
export const TimelineReducer = (state = null, action) => {
  switch (action.type) {
  case 'UPDATE_TIMELINE':
    return action.timeline;
  default:
    return state;
  }
};

export default TimelineReducer;