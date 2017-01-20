const UserReducer = (state = {}, action) => {
  switch (action.type) {
  case 'FETCH_USERS':
    return { users: null, usersLoading: true, usersError: null };
  case 'RESOLVED_FETCH_USERS':
    return { users: action.users, usersLoading: false, usersError: null };
  case 'FAILED_FETCH_USERS':
    return { users: null, usersLoading: false, usersError: action.usersError };
  default:
    return state;
  }
};

export default UserReducer;