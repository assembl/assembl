import React from 'react';
import ReactDOM from 'react-dom';
import Search from './components/search.jsx?v=1'; // eslint-disable-line

import '../../css/views/searchv1.scss';

ReactDOM.render(
  <Search />,
  document.getElementById('search')
);