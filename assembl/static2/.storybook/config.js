import 'bootstrap/dist/css/bootstrap.css';
import '../css/themes/default/assembl_web.scss';

import { I18n } from 'react-i18nify';
import { configure } from '@storybook/react';

import messages from '../js/app/utils/translations';

I18n.setTranslations(messages);
I18n.setLocale('fr');

function loadStories() {
  require('../js/app/stories/components/common/common.jsx');
  require('../js/app/stories/components/common/urlPreview/urlPreview.jsx');
  require('../js/app/stories/components/common/urlPreview/embed.jsx');
  require('../js/app/stories/components/common/urlPreview/frame.jsx');
}

configure(loadStories, module);
