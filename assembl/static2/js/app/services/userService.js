import HttpRequestHandler from '../utils/httpRequestHandler';

class UserService {
  static fetchUsers(debateId) {
    const that = this;
    const fetchUsersUrl = `/api/v1/discussion/${debateId}/agents/`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchUsersUrl }).then((users) => {
      return that.buildUsers(users);
    });
  }
  static buildUsers(users) {
    return {
      totalVerifiedUsers: this.getTotalVerifiedUsers(users),
      allUsers: users
    };
  }
  static getTotalVerifiedUsers(users) {
    let count = 0;
    users.forEach((user) => {
      if (user.verified) count += 1;
    });
    return count;
  }
  static fetchUser(debateId, userId) {
    const fetchConnectedUserUrl = `/api/v1/discussion/${debateId}/agents/${userId}`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchConnectedUserUrl }).then((user) => {
      return user;
    });
  }
}

export default UserService;