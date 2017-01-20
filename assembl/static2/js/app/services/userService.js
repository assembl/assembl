import HttpRequestHandler from '../utils/httpRequestHandler';

class UserService {
  static fetchUsers(discussionId) {
    const that = this;
    const fetchUsersUrl = `discussion/${discussionId}/agents/`;
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
}

export default UserService;