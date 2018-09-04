// @flow
import htmlToEntity from '../htmlToEntity';

describe('htmlToEntity function', () => {
  it('should transform entity and original text into a <a> tag', () => {
    const createEntitySpy = jest.fn();
    const nodeName = 'a';
    const node = document.createElement('a');
    node.href = 'http://www.bluenove.com';
    node.target = '_blank';
    node.title = 'Bluenove';
    const expectedData = {
      target: '_blank',
      title: 'Bluenove',
      url: 'http://www.bluenove.com/'
    };
    htmlToEntity(nodeName, node, createEntitySpy);
    expect(createEntitySpy).toHaveBeenCalledWith('LINK', 'MUTABLE', expectedData);
  });
});