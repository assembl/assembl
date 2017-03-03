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

const emptyArray = [];
export const getPermissionsForConnectedUser = (state) => {
  if (!state.users) {
    return emptyArray;
  }
  const debateId = state.context.debateId;
  if (!state.users.connectedUser) {
    return emptyArray;
  }
  const permissions = state.users.connectedUser.permissions[`local:Discussion/${debateId}`];
  if (!permissions) {
    return emptyArray;
  }
  return permissions;
};