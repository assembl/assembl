import React from 'react';
import renderer from 'react-test-renderer';

import EditAttachments from '../../../../js/app/components/common/editAttachments';

describe('EditAttachments component', () => {
  it('should render the list of attachments with delete buttons', () => {
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
    const onDeleteSpy = jest.fn(() => {});
    const component = renderer.create(<EditAttachments attachments={attachments} onDelete={onDeleteSpy} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});