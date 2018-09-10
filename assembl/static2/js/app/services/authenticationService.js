import { xmlHttpRequest } from '../utils/httpRequestHandler';
import { PasswordMismatchError } from '../utils/errors';

export const postChangePassword = (payload) => {
  const route = '/data/AgentProfile/do_password_change';
  if (payload.password1 !== payload.password2) {
    return Promise.reject(new PasswordMismatchError('Passwords do not match!'));
  }

  return xmlHttpRequest({
    method: 'POST',
    url: route,
    isJson: true,
    payload: payload
  });
};

export const signUp = (payload) => {
  const {
    privacyPolicyIsChecked,
    termsAndConditionsIsChecked,
    discussionSlug, email,
    fullname,
    password,
    password2,
    username,
    ...rest
  } = payload;

  if (password !== password2) {
    return Promise.reject(new PasswordMismatchError('Passwords do not match!'));
  }

  let route;
  if (!discussionSlug) {
    route = '/data/User';
  } else {
    route = `/data/Discussion/${discussionSlug}/all_users`;
  }

  const newPayload = {
    username: username || null,
    real_name: fullname,
    password: password,
    accounts: [
      {
        email: email,
        '@type': 'EmailAccount'
      }
    ],
    profileFields: rest
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

  if (discussionSlug) {
    payload.discussion_slug = discussionSlug;
  }

  return xmlHttpRequest({
    method: 'POST',
    url: route,
    isJson: true,
    payload: payload
  });
};