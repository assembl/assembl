import request from 'superagent';
import urljoin from 'url-join';

import { basePath } from './server';

export async function getCSRFToken() {
  // Get CSRF token, note the response contains nothing as the cookie is set directly!!
  const responseToken = await request.get(urljoin(basePath(), '/v1/generateToken')).withCredentials();

  return responseToken;
}