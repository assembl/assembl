import React from 'react';
import ReactDOM from 'react-dom';
import Search from './components/search.jsx?v=1'; // eslint-disable-line

import '../../css/views/searchv1.scss';

/*
searchv1.js is included in assembl/templates/index.jinja2
(you need to change the url for production)
The search div is included in the page from assembl/templates/views/navBar.tmpl
and the Search react component is rendered via the onDomRefresh event in
assembl/static/js/app/views/navBar.js
*/

const renderSearch = () => {
  ReactDOM.render(
    <Search />,
    document.getElementById('search')
  );
};
global.renderSearch = renderSearch;