import React from 'react';
import { configure } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.css';
import '../css/themes/default/assembl_web.scss';

function loadStories() {
  require('../js/app/integration/101/components/button101.stories.jsx');

  // TODO: To clean ?
  // require('../js/app/stories/components/common/common.jsx');
  // require('../js/app/stories/components/common/urlPreview/urlPreview.jsx');
  // require('../js/app/stories/components/common/urlPreview/embed.jsx');
  // require('../js/app/stories/components/common/urlPreview/frame.jsx');
}

configure(loadStories, module);
