/** *
 * Use the standard assembl server location for API calls or Stargate
 *
 * @return String path - the path to use for the API call
 * */
export const basePath = () => {
  const useStargate = document.getElementById('useStargate') ? document.getElementById('useStargate').value : 'false';
  const stargatePort = document.getElementById('stargatePort') ? document.getElementById('stargatePort').value : '3000';

  let path = `${window.location.protocol}//${window.location.host}`;

  if (useStargate === 'true') {
    path = `${window.location.protocol}//${window.location.hostname}:${stargatePort}`;
  }

  return path;
};