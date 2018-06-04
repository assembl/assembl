/*
  Stories for components/common/urlPreview/embed
*/
import React from 'react';
import { storiesOf } from '@storybook/react';

import Embed from '../../../../components/common/urlPreview/embed';

const youtubeUrl = 'https://www.youtube.com/watch?v=m1ET6SEtwbc';

const url = 'https://foo.bar';

const defaultEmbed = <div>Default component</div>;

storiesOf('Embed', module)
  .add('default', () => <Embed url={url} defaultEmbed={defaultEmbed} />)
  .add('youtube', () => <Embed url={youtubeUrl} defaultEmbed={defaultEmbed} />);