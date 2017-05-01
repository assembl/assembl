const convertToURLEncodedString = (obj) => {
  return Object.keys(obj).map((k) => { return `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`; }).join('&');
};
const getResponseContentType = (xhr) => { // eslint-disable-line no-unused-vars
  return xhr.getResponseHeader('Content-Type').split(';')[0];
};
/*
  A global async method that returns a Promisified ajax call
  @params payload [Object] The object that will be sent
  @params isJson [Boolean] Pass a flag if the object is JSON. Default is form header.
  @retuns [Promise]
*/
export const xmlHttpRequest = (obj) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = obj.url;
    let payload = obj.payload;
    xhr.open(obj.method, url);
    if (obj.method.toLowerCase() === 'post') {
      obj.headers = obj.headers || {}; // eslint-disable-line
      if (obj.isJson && obj.isJson === true) {
        obj.headers['Content-Type'] = 'application/json'; // eslint-disable-line
        payload = JSON.stringify(obj.payload);
      } else {
        obj.headers['Content-Type'] = 'application/x-www-form-urlencoded'; // eslint-disable-line
        payload = convertToURLEncodedString(payload);
      }
    }
    if (obj.headers) {
      Object.keys(obj.headers).forEach((key) => {
        xhr.setRequestHeader(key, obj.headers[key]);
      });
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let resp = xhr.response;
        try {
          resp = JSON.parse(resp);
        }
        catch (e) {
          // TODO: Remove console warn AFTER a successful contract is agreed upon
          console.warn("A successful response did not return JSON. Passing status only.");
          resp = xhr.status;
        }
        resolve(resp);
      } else {
        let resp;
        // TODO: Agree on contract with backend for all APIs!!
        // Current system not very intuitive nor friendly
        try {
          resp = JSON.parse(xhr.responseText);
          reject(resp || xhr.statusText);
        } catch (e) {
          // A non-JSONError response, likely from Pyramid itself
          // Short term solution until contract established
          reject(xhr.status);
        }
      }
    };
    xhr.onerror = () => {
      // TODO: If JSON returned format, parse accordingly
      return reject(xhr.responseText || xhr.statusText);
    };
    xhr.send(payload);
  });
};