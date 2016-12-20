import React from 'react';
import ReactDOM from 'react-dom';
import '../../css/main.scss';
import Debate from './components/debateComponent';

require('bootstrap/dist/css/bootstrap.css');

ReactDOM.render(
  <Debate />,
  document.getElementById('root')
);