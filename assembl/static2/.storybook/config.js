import React from 'react';
import { configure, addDecorator } from '@storybook/react';
import { setOptions } from '@storybook/addon-options';
import { I18n } from 'react-i18nify';
import centered from '@storybook/addon-centered'; // Library used to center H and V a component
import messages from '../js/app/utils/translations';

import 'bootstrap/dist/css/bootstrap.css';
import '../css/themes/default/assembl_web.scss';

addDecorator(centered);

// Option defaults:
setOptions({
  name: 'Assembl',
  url: '#'
});

I18n.setTranslations(messages);
I18n.setLocale('fr');

function loadStories() {
  require('../js/app/integration/101/components/button101/button101.stories.jsx');
  require('../js/app/integration/101/components/checkbox101/checkbox101.stories.jsx');
  require('../js/app/integration/101/components/checkboxList101/checkboxList101.stories.jsx');

  require('../js/app/stories/components/debate/brightMirror/fictionPreview.stories.jsx');
  require('../js/app/stories/components/debate/brightMirror/fictionsList.stories.jsx');
  require('../js/app/stories/components/debate/brightMirror/instructionsText.stories.jsx');
  require('../js/app/stories/components/debate/brightMirror/circleAvatar.stories.jsx');
  require('../js/app/stories/components/debate/brightMirror/fictionHeader.stories.jsx');
  require('../js/app/stories/components/debate/brightMirror/fictionBody.stories.jsx');

  // TODO: To clean ?
  // require('../js/app/stories/components/common/common.jsx');
  // require('../js/app/stories/components/common/urlPreview/urlPreview.jsx');
  // require('../js/app/stories/components/common/urlPreview/embed.jsx');
  // require('../js/app/stories/components/common/urlPreview/frame.jsx');
}

configure(loadStories, module);
