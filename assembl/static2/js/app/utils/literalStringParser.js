/*
  https://gist.github.com/bryanerayner/68e1498d4b1b09a30ef6#file-generatetemplatestring-js
  Can take a string, that is not a string literal (ES6 feature) and parse it using
  data.

  eg. parse("Hello ${name}", {name: "World"})
  => "Hello World"
*/
/* eslint no-useless-escape: off, no-new-func: off */

function get(path, obj, fb = `$\{${path}}`) {
  return path.split('.').reduce((res, key) => res[key] || fb, obj);
}

function parse(template, map, fallback) {
  return template.replace(/\$\{.+?}/g, (match) => {
    const path = match.substr(2, match.length - 3).trim();
    return get(path, map, fallback);
  });
}

export default parse;