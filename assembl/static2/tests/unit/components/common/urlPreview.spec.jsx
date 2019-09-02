import React from 'react';
import renderer from 'react-test-renderer';
import URLPreview from '../../../../js/app/components/common/urlPreview/urlPreview';

describe('UrlPreview component', () => {
  const imgUrl = 'https://images.unsplash.com/uploads/141155339325423394b24/03982423';

  const authorAvatar =
    'https://images.pexels.com/photos/67636/rose-blue-flower-rose-blooms-67636.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260';

  const faviconUrl = 'https://images.pexels.com/photos/247932/pexels-photo-247932.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260';

  const props = {
    id: 'postId',
    url: 'https://foo.bar/1234',
    title: 'My foo&#039;bar title',
    description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been.',
    faviconUrl: faviconUrl,
    authorName: '@tarti',
    authorAvatar: authorAvatar,
    providerName: 'FooBar',
    html: '',
    thumbnailUrl: imgUrl
  };
  it('should match snapshot', () => {
    const rendered = renderer.create(<URLPreview {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});