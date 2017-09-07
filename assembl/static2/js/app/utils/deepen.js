/*
   Transform an object with dotted keys into nested objects
   Example:
   deepen({ 'ab.cd.e': 'foo', 'ab.cd.f': 'bar', 'ab.g': 'foo2' }));
   returns
   { ab: { cd: { e: 'foo', f: 'bar' }, g: 'foo2' } }
*/
export default function deepen(o) {
  const oo = {};
  Object.keys(o).forEach((k) => {
    let t = oo;
    const parts = k.split('.');
    const key = parts.pop();
    while (parts.length) {
      const part = parts.shift();
      t = t[part] = t[part] || {}; // eslint-disable-line
    }
    t[key] = o[k];
  });
  return oo;
}