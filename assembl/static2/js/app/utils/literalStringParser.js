/*
	https://gist.github.com/bryanerayner/68e1498d4b1b09a30ef6#file-generatetemplatestring-js
	Can take a string, that is not a string literal (ES6 feature) and parse it using
	data.

	eg. parse("Hello ${name}", {name: "World"})
	=> "Hello World"
*/

const cache = {};

const createParser = (template) => {
  var sanitized = template
  // Replace ${expressions} (etc) with ${map.expressions}.
  .replace(/\$\{([\s]*[^;\s\{]+[\s]*)\}/g, (_, match) => `\$\{map.${match.trim()}\}`)
  // Afterwards, replace anything that's not ${map.expressions}' (etc) with a blank string.
  .replace(/(\$\{(?!map\.)[^}]+\})/g, '');

  return Function('map', `return \`${sanitized}\``);
}



const parse = (template, map) => {
  const parser = cache[template] = cache[template] || createParser(template);
  return map ? parser(map) : parser();
};

export default parse;