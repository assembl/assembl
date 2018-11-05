// @flow
import htmlToEntity from '../htmlToEntity';

describe('htmlToEntity function', () => {
  it('should create an link entity from a <a> html node', () => {
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

  it('should not create a link entity from a <a> with an <img> in it (attachment)', () => {
    const createEntitySpy = jest.fn();
    const nodeName = 'a';
    const node = document.createElement('a');
    node.href = 'http://www.bluenove.com';
    node.target = '_blank';
    node.title = 'Bluenove';
    const firstChild = document.createElement('img');
    firstChild.src = '/data/my-doc.pdf';
    node.appendChild(firstChild);
    htmlToEntity(nodeName, node, createEntitySpy);
    expect(createEntitySpy).not.toHaveBeenCalled();
  });
});