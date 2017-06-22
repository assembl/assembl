import { getDiscussionId } from '../utils/globalFunctions';

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
const discussionId = getDiscussionId();

export const getPermissionsForConnectedUser = (state) => {
  if (!state.users) {
    return emptyArray;
  }
  if (state.users.users === null) {
    return emptyArray;
  }
  if (state.users.usersLoading) {
    return emptyArray;
  }
  if (!state.users.users.connectedUser.permissions) {
    return emptyArray;
  }

  const permissions = state.users.users.connectedUser.permissions[`local:Discussion/${discussionId}`];

  return permissions;
};