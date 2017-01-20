import UserService from '../services/userService';

class UsersActions {
  static fetchUsers(debateId) {
    const that = this;
    return function (dispatch) {
      dispatch(that.loadingUsers());
      return UserService.fetchUsers(debateId).then((users) => {
        dispatch(that.resolvedFetchUsers(users));
      }).catch((error) => {
        dispatch(that.failedFetchUsers(error));
      });
    };
  }
  static loadingUsers() {
    return {
      type: 'FETCH_USERS',
      users: null
    };
  }
  static resolvedFetchUsers(users) {
    return {
      type: 'RESOLVED_FETCH_USERS',
      users: users
    };
  }
  static failedFetchUsers(error) {
    return {
      type: 'FAILED_FETCH_USERS',
      usersError: error
    };
  }
}

export default UsersActions;