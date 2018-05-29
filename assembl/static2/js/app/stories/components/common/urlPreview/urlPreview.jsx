/*
  Stories for components/common
*/
import React from 'react';
import { storiesOf } from '@storybook/react';

import URLPreview from '../../../../components/common/urlPreview/urlPreview';

const imgUrl = 'https://images.unsplash.com/uploads/141155339325423394b24/03982423';

const authorAvatar =
  'https://images.pexels.com/photos/67636/rose-blue-flower-rose-blooms-67636.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260';

const faviconUrl = 'https://images.pexels.com/photos/247932/pexels-photo-247932.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260';

const urlData = {
  id: 'postId',
  url: 'https://foo.bar/1234',
  title: 'My foo bar title',
  description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been.',
  faviconUrl: faviconUrl,
  authorName: '',
  authorAvatar: '',
  providerName: 'FooBar',
  html: '',
  thumbnailUrl: imgUrl
};

const urlPostData = {
  id: 'postId',
  url: 'https://foo.bar/1234',
  title: 'My foo bar title',
  description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been.',
  faviconUrl: faviconUrl,
  authorName: '@tarti',
  authorAvatar: authorAvatar,
  providerName: 'FooBar',
  html: '',
  thumbnailUrl: imgUrl
};

storiesOf('URLPreview', module)
  .add('default', () => <URLPreview {...urlData} />)
  .add('with author', () => <URLPreview {...urlPostData} />);