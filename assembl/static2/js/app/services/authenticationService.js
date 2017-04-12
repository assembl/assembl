import { xmlHttpRequest } from '../utils/httpRequestHandler';
import { PasswordMismatchError } from '../utils/errors'; 

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
    return Promise.reject(new PasswordMismatchError("Passwords do not match!"));
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
    isJson: true,
    payload: newPayload
  });
};