import HttpRequestHandler from '../utils/httpRequestHandler';

export const fetchPermissionsForUser = (discussionId, userId) => {
  const url = `/api/v1/discussion/${discussionId}/permissions/u/${userId}`;
  return HttpRequestHandler.request({ method: 'GET', url: url }).then((permissions) => {
    return permissions;
  });
};

class UserService {
  static fetchUsers(debateId, connectedUserId) {
    const that = this;
    const fetchUsersUrl = `/api/v1/discussion/${debateId}/agents/`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchUsersUrl }).then((users) => {
      return that.buildUsers(users, connectedUserId);
    });
  }
  static buildUsers(users, connectedUserId) {
    const usersData = this.iterateOnAllUsers(users, connectedUserId);
    return {
      totalVerifiedUsers: usersData[0],
      allUsers: users,
      connectedUser: usersData[1]
    };
  }
  static iterateOnAllUsers(users, connectedUserId) {
    let count = 0;
    let connectedUser = {};
    users.forEach((user) => {
      const userId = user['@id'].split('/')[1];
      if (userId === connectedUserId) connectedUser = user;
      if (user.verified) count += 1;
    });
    return [count, connectedUser];
  }
}

export default UserService;