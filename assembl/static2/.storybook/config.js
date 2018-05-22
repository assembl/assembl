import 'bootstrap/dist/css/bootstrap.css';
import '../css/themes/default/assembl_web.scss';
import { configure } from '@storybook/react';

function loadStories() {
  require('../js/app/stories/common.jsx');
}

configure(loadStories, module);
