import { xmlHttpRequest } from '../utils/httpRequestHandler';

export const postChangePassword = (payload) => {
  const route = '/data/AgentProfile/do_password_change';
  return xmlHttpRequest({
	  	method: 'POST',
	  	url: route,
	  	payload: payload
	  }).then((response) => {
    return response;
  });
};