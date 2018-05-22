/* eslint-disable no-param-reassign */
// @flow

type MetadataResponsProps = {
  code: string,
  metadata: Object
};

function formatDict(dict: Object | null) {
  const result = {};
  if (!dict) return result;
  const reducer = (accumulator, key) => {
    // key to camelcase
    const newKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
    accumulator[newKey] = dict && dict[key];
    return accumulator;
  };
  Object.keys(dict).reduce(reducer, result);
  return result;
}

export const fetchURLMetadata = (url: string, onLoad: Function, onError?: Function): void => {
  const urlMetadataWebService = `http://0.0.0.0:5000/?url=${url}`;
  fetch(urlMetadataWebService)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      return null;
    })
    .then((response: MetadataResponsProps | null) => {
      const ok = response && response.code === 'SUCCESS';
      if (ok) {
        onLoad(formatDict(response && response.metadata));
      } else if (onError) onError();
    });
};

export function resizeIframe(id: string) {
  const ifrm = document.getElementById(id);
  if (ifrm && ifrm instanceof HTMLIFrameElement) {
    const doc = ifrm.contentDocument ? ifrm.contentDocument : ifrm.contentWindow && ifrm.contentWindow.document;
    if (doc && doc.body) {
      const body = doc.body;
      const height = Math.max(body.scrollHeight, body.offsetHeight);
      ifrm.style.height = `${height + 50}px`;
      const resizeIframeCall = () => {
        resizeIframe(id);
        body.removeEventListener('DOMSubtreeModified', resizeIframeCall);
      };
      body.addEventListener('DOMSubtreeModified', resizeIframeCall);
    }
  }
}

export function getScripts(html: string) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return Array.from(d.getElementsByTagName('script')).map(script => script.getAttribute('src'));
}