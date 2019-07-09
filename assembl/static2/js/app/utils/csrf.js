import urljoin from 'url-join';

import { basePathV2 } from './server';

export async function getCSRFToken() {
  // Get CSRF token, note the response contains nothing as the cookie is set directly!!
  await fetch(urljoin(basePathV2(), '/v1/generateToken'), {
    credentials: 'include'
  });
}