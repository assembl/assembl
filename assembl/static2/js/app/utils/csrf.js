import urljoin from 'url-join';

import { basePath } from './server';

export async function getCSRFToken() {
  // Get CSRF token, note the response contains nothing as the cookie is set directly!!
  const responseToken = await fetch(urljoin(basePath(), '/v1/generateToken'), {
    credentials: 'include'
  });

  return responseToken;
}