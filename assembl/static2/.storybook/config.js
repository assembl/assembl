import React from 'react';
import { configure, addDecorator } from '@storybook/react';
import centered from '@storybook/addon-centered'; // Library used to center H and V a component

import 'bootstrap/dist/css/bootstrap.css';
import '../css/themes/default/assembl_web.scss';

addDecorator(centered);

function loadStories() {
  require('../js/app/integration/101/components/button101/button101.stories.jsx');
  require('../js/app/integration/101/components/checkbox101/checkbox101.stories.jsx');
  require('../js/app/integration/101/components/checkboxList101/checkboxList101.stories.jsx');

  // TODO: To clean ?
  // require('../js/app/stories/components/common/common.jsx');
  // require('../js/app/stories/components/common/urlPreview/urlPreview.jsx');
  // require('../js/app/stories/components/common/urlPreview/embed.jsx');
  // require('../js/app/stories/components/common/urlPreview/frame.jsx');
}

configure(loadStories, module);
