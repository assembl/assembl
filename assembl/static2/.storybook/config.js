import 'bootstrap/dist/css/bootstrap.css';
import '../css/themes/default/assembl_web.scss';
import { configure } from '@storybook/react';

function loadStories() {
  require('../js/app/stories/components/common/common.jsx');
  require('../js/app/stories/components/common/urlPreview/urlPreview.jsx');
  require('../js/app/stories/components/common/urlPreview/embed.jsx');
  require('../js/app/stories/components/common/urlPreview/frame.jsx');
}

configure(loadStories, module);
