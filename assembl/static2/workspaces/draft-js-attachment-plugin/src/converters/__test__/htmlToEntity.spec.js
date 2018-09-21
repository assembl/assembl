// @flow
import htmlToEntity from '../htmlToEntity';

function createLegacyImageNode() {
  const node = document.createElement('img');
  node.dataset = { id: 'doc789' };
  const parentNode = document.createElement('div');
  const grandparentNode = document.createElement('div');
  parentNode.appendChild(node);
  grandparentNode.appendChild(parentNode);
  node.src = '/data/my-img.jpg';
  return node;
}

function createAtomicBlockWithImg() {
  const node = document.createElement('div');
  node.dataset = { blocktype: 'atomic' };
  const imageNode = document.createElement('img');
  imageNode.dataset = {
    id: 'foobar',
    mimetype: 'image/png'
  };
  imageNode.src = '/data/my-img.png';
  node.appendChild(imageNode);
  return node;
}

function createAtomicBlockWithDocument() {
  const node = document.createElement('div');
  node.dataset = { blocktype: 'atomic' };
  const linkNode = document.createElement('a');
  const iconNode = document.createElement('img');
  iconNode.dataset = {
    externalurl: '/data/my-doc.pdf',
    id: 'foobar',
    mimetype: 'application/pdf',
    title: 'My document'
  };
  iconNode.alt = 'pdf';
  iconNode.className = 'attachment-icon';
  iconNode.src = '/static2/img/icons/black/doc.svg';
  linkNode.appendChild(iconNode);
  node.appendChild(linkNode);
  return node;
}

describe('htmlToEntity function', () => {
  const createEntitySpy = jest.fn();

  it('should create an image entity for legacy html (v1)', () => {
    const node = createLegacyImageNode();
    createEntitySpy.mockReturnValue('44');
    const actual = htmlToEntity('img', node, createEntitySpy);
    const expected = '44';
    expect(actual).toEqual(expected);
    expect(createEntitySpy).toHaveBeenCalledWith('IMAGE', 'IMMUTABLE', {
      id: 'doc789',
      mimeType: 'image/*',
      src: '/data/my-img.jpg',
      title: '',
      type: 'IMAGE'
    });
  });

  it('should create an image entity for atomic block with image', () => {
    createEntitySpy.mockReturnValue('42');
    const node = createAtomicBlockWithImg();
    const actual = htmlToEntity('div', node, createEntitySpy);
    const expected = '42';
    expect(actual).toEqual(expected);
    expect(createEntitySpy).toHaveBeenCalledWith('IMAGE', 'IMMUTABLE', {
      id: 'foobar',
      mimeType: 'image/png',
      src: '/data/my-img.png',
      title: '',
      type: 'IMAGE'
    });
  });

  it('should create a document entity for atomic block with document', () => {
    const node = createAtomicBlockWithDocument();
    createEntitySpy.mockReturnValue('33');
    const actual = htmlToEntity('div', node, createEntitySpy);
    const expected = '33';
    expect(actual).toEqual(expected);
    expect(createEntitySpy).toHaveBeenCalledWith('DOCUMENT', 'IMMUTABLE', {
      id: 'foobar',
      mimeType: 'application/pdf',
      src: '/data/my-doc.pdf',
      title: 'My document',
      type: 'DOCUMENT'
    });
  });
});