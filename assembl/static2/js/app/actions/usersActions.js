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
      payload: null
    };
  }
  static resolvedFetchUsers(users) {
    return {
      type: 'RESOLVED_FETCH_USERS',
      payload: users
    };
  }
  static failedFetchUsers(err) {
    return {
      type: 'FAILED_FETCH_USERS',
      error: err
    };
  }
}

export default UsersActions;