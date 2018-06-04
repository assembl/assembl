/*
  Stories for components/common/urlPreview/frame
*/
import React from 'react';
import { storiesOf } from '@storybook/react';

import Frame from '../../../../components/common/urlPreview/frame';

const imgUrl = 'https://images.unsplash.com/uploads/141155339325423394b24/03982423';
const html = `<img src='${imgUrl}' width='300' height='300'>`;

storiesOf('Frame', module).add('default', () => <Frame id="Foo" html={html} />);