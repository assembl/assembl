/** *
 * Use the standard assembl server location for API calls or Stargate
 *
 * @return String path - the path to use for the API call
 * */
export const basePath = () => {
  const useStargate = document.getElementById('useStargate') ? document.getElementById('useStargate').value : 'false';

  let path = `${window.location.protocol}//${window.location.host}`;

  if (useStargate === 'true') {
    path = `${window.location.protocol}//${window.location.hostname}:3000`; // move to config ?
  }

  return path;
};