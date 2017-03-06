import { getUsers } from '../services/userService';

const loadingUsers = () => {
  return {
    type: 'FETCH_USERS',
    users: null
  };
};

const resolvedFetchUsers = (users) => {
  return {
    type: 'RESOLVED_FETCH_USERS',
    users: users
  };
};

const failedFetchUsers = (error) => {
  return {
    type: 'FAILED_FETCH_USERS',
    usersError: error
  };
};

export const fetchUsers = (debateId, connectedUserId) => {
  return function (dispatch) {
    dispatch(loadingUsers());
    return getUsers(debateId, connectedUserId).then((users) => {
      dispatch(resolvedFetchUsers(users));
    }).catch((error) => {
      dispatch(failedFetchUsers(error));
    });
  };
};