import { xmlHttpRequest } from '../utils/httpRequestHandler';

const iterateOnAllUsers = (users, connectedUserId) => {
  let count = 0;
  let connectedUser = {};
  users.forEach((user) => {
    const userId = user['@id'].split('/')[1];
    if (userId === connectedUserId) connectedUser = user;
    if (user.verified) count += 1;
  });
  return [count, connectedUser];
};

const buildUsers = (users, connectedUserId) => {
  const usersData = iterateOnAllUsers(users, connectedUserId);
  return {
    totalVerifiedUsers: usersData[0],
    allUsers: users,
    connectedUser: usersData[1]
  };
};

export const getUsers = (debateId, connectedUserId) => {
  const getUsersUrl = `/api/v1/discussion/${debateId}/agents/`;
  return xmlHttpRequest({ method: 'GET', url: getUsersUrl }).then((users) => {
    return buildUsers(users, connectedUserId);
  });
};

export const fetchPermissionsForUser = (discussionId, userId) => {
  const url = `/api/v1/discussion/${discussionId}/permissions/u/${userId}`;
  return xmlHttpRequest({ method: 'GET', url: url }).then((permissions) => {
    return permissions;
  });
};