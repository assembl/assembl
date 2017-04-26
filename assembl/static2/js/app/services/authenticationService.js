import { xmlHttpRequest } from '../utils/httpRequestHandler';
import { PasswordMismatchError } from '../utils/errors';

export const postChangePassword = (payload) => {
  const route = '/data/AgentProfile/do_password_change';
  return xmlHttpRequest({
    method: 'POST',
    url: route,
    isJson: true,
    payload: payload
  });
};

export const signUp = (payload) => {
  if (payload.password1 !== payload.password2) {
    return Promise.reject(new PasswordMismatchError('Passwords do not match!'));
  }

  let route;
  if (payload.discussionSlug) { route = '/data/User'; }
  else { route = `/data/Discussion/${payload.discussionSlug}/all_users`; }
  const newPayload = {
    username: payload.username || null,
    real_name: payload.name,
    password: payload.password1,
    accounts: [{
      email: payload.email,
      '@type': 'EmailAccount'
    }]
  };

  return xmlHttpRequest({
    method: 'POST',
    url: route,
    isJson: true,
    payload: newPayload
  });
};

export const changePasswordRequest = (id, discussionSlug) => {
  const route = '/data/AgentProfile/password_reset';
  const payload = {
    identifier: id
  };

  if (discussionSlug) { payload.discussion_slug = discussionSlug; }

  return xmlHttpRequest({
    method: 'POST',
    url: route,
    isJson: true,
    payload: payload
  });
};