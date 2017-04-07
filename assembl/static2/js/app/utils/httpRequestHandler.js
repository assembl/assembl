const convertToURLEncodedString = (obj) => {
  return Object.keys(obj).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`).join('&'); 
}


export const xmlHttpRequest = (obj) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = obj.url;
    let payload = obj.payload;
    xhr.open(obj.method, url);
    if (obj.method.toLowerCase() === 'post'){
      obj.headers = obj.headers || {};
      if (obj.isJson && obj.isJson === true){
        obj.headers['Content-Type'] = 'application/json';
        payload = JSON.encode(obj.payload);
      }
      else {
        obj.headers['Content-Type'] = 'application/x-www-form-urlencoded';
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
        resolve(JSON.parse(xhr.response));
      } else {
        reject(xhr.statusText);
      }
    };
    xhr.onerror = () => {
      return reject(xhr.statusText);
    };
    xhr.send(payload);
  });
};