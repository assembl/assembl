import { xmlHttpRequest } from '../utils/httpRequestHandler';

export const postChangePassword = (payload) => {
  const route = '/data/AgentProfile/do_password_change';
  return xmlHttpRequest({
	  	method: 'POST',
	  	url: route,
	  	payload: payload
	  });
};

export const signUp = (payload) => {
  if (payload.password1 !== payload.password2) {
    alert("Passwords don't match");
    return Promise.reject(new TypeError("Passwords do not match!"));
  }

  const route = '/data/User';
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
    payload: newPayload
  });
};