# Draft.js Link Plugin

*This is a plugin for the `draft-js-plugins-editor`.*

This plugin is based on `draft-js-anchor-plugin`.

This plugin allows you to add link entities via the [static toolbar](https://www.draft-js-plugins.com/plugin/static-toolbar). It also provides a decorator that formats the created entities. HTTP, HTTPS, as well as email addresses (with or without mailto: attached to it) are supported.

## Usage

```js
import createLinkPlugin from 'draft-js-link-plugin';

const linkPlugin = createLinkPlugin();
```
