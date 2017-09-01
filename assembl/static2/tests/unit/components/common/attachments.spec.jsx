import React from 'react';
import renderer from 'react-test-renderer';

import Attachments from '../../../../js/app/components/common/attachments';

describe('Attachments component', () => {
  it('should render the list of attachments', () => {
    const attachments = [
      {
        id: 'foo',
        title: 'Foo',
        externalUrl: 'http://www.example.com/foo'
      },
      {
        id: 'bar',
        title: 'Bar.jpg',
        externalUrl: 'http://www.example.com/bar.jpg',
        mimeType: 'image/jpeg'
      }
    ];
    const component = renderer.create(<Attachments attachments={attachments} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});