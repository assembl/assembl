import request from 'superagent';
import urljoin from 'url-join';

export const basePath = () => {
  const useStargate = document.getElementById('useStargate') ? document.getElementById('useStargate').value : null;

  let path = `${window.location.protocol}//${window.location.host}`;

  if (useStargate === 'true') {
    path = `${window.location.protocol}//localhost:3000`;
  }

  return path;
};

export async function getCSRFToken() {
  // Get CSRF token, not the response cointains nothing as the cookie is set directly!!
  const responseToken = await request.get(urljoin(basePath(), '/v1/generateToken')).withCredentials();

  return responseToken;
}