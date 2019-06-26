/**
 * Use the standard assembl server location for API calls or Stargate
 *
 * @param Object obj - the object that will be sent - don't use stargate for certain jobs
 *
 * @return String path - the path to use for the API call
 */
export const basePath = (obj) => {
  const useStargate = document.getElementById('useStargate') ? document.getElementById('useStargate').value : 'false';
  const stargatePort = document.getElementById('stargatePort') ? document.getElementById('stargatePort').value : '3000';

  let path = `${window.location.protocol}//${window.location.host}`;

  // Only pass json requests
  if (obj.headers['Content-Type'] !== 'application/x-www-form-urlencoded') {
    if (useStargate === 'true') {
      path = `${window.location.protocol}//${window.location.hostname}:${stargatePort}`;
    }
  }

  return path;
};