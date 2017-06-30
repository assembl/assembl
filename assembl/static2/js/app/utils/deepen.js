export default function deepen(o) {
  const oo = {};
  Object.keys(o).forEach((k) => {
    let t = oo;
    const parts = k.split('.');
    const key = parts.pop();
    while (parts.length) {
      const part = parts.shift();
      t = t[part] = t[part] || {};
    }
    t[key] = o[k];
  });
  return oo;
}