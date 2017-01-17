const UserReducer = (state = {}, action) => {
  switch (action.type) {
  case 'FETCH_USERS':
    return { users: null, usersLoading: true, usersError: null };
  case 'RESOLVED_FETCH_USERS':
    return { users: action.payload, usersLoading: false, usersError: null };
  case 'FAILED_FETCH_USERS':
    return { users: null, usersLoading: false, usersError: action.error };
  default:
    return state;
  }
};

export default UserReducer;