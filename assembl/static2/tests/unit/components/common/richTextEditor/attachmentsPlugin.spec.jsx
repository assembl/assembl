import { convertFromRaw, convertToRaw, ContentState, Entity } from 'draft-js';

import plugin from '../../../../../js/app/components/common/richTextEditor/attachmentsPlugin';

// see draft-convert convertFromHTML.js
let contentState = ContentState.createFromText('');
const createEntity = (...args) => {
  if (contentState.createEntity) {
    contentState = contentState.createEntity(...args);
    return contentState.getLastCreatedEntityKey();
  }

  return Entity.create(...args);
};

const rcs = {
  blocks: [
    {
      data: {},
      depth: 0,
      key: 'eokpt',
      text: 'Lorem ipsum dolor sit amet',
      type: 'unstyled',
      entityRanges: [],
      inlineStyleRanges: []
    },
    {
      data: {},
      depth: 0,
      key: '73oie',
      text: ' ',
      type: 'atomic',
      entityRanges: [{ offset: 0, length: 1, key: 0 }],
      inlineStyleRanges: []
    },
    {
      data: {},
      depth: 0,
      key: '39pxu',
      text: '',
      type: 'unstyled',
      entityRanges: [],
      inlineStyleRanges: []
    },
    {
      data: {},
      depth: 0,
      key: '99bis',
      text: ' ',
      type: 'atomic',
      entityRanges: [{ offset: 0, length: 1, key: 1 }],
      inlineStyleRanges: []
    },
    {
      data: {},
      depth: 0,
      key: '55ter',
      text: '',
      type: 'unstyled',
      entityRanges: [],
      inlineStyleRanges: []
    }
  ],
  entityMap: {
    0: {
      type: 'document',
      mutability: 'IMMUTABLE',
      data: { id: '1234', title: 'Foobar', mimeType: 'application/pdf' }
    },
    1: {
      type: 'document',
      mutability: 'IMMUTABLE',
      data: { id: '1236', externalUrl: 'http://www.example.com/foo.png', mimeType: 'image/png' }
    }
  }
};

describe('attachmentsPlugin', () => {
  describe('blockToHTML function', () => {
    const { blockToHTML } = plugin;
    it('should return undefined for non atomic block', () => {
      const block = {
        type: 'unstyled'
      };
      const result = blockToHTML(block);
      expect(result).toBeUndefined();
    });

    it('should return start and end tags for atomic block', () => {
      const block = {
        type: 'atomic'
      };
      const result = blockToHTML(block);
      const expected = {
        start: '<div class="atomic-block" data-blocktype="atomic">',
        end: '</div>'
      };
      expect(result).toEqual(expected);
    });
  });

  describe('entityToHTML function', () => {
    const { entityToHTML } = plugin;
    it('should return originalText for other entities', () => {
      const entity = {
        type: 'foobar'
      };
      const result = entityToHTML(entity, 'My original text');
      expect(result).toEqual('My original text');
    });

    it('should return an img tag for images', () => {
      const entity = {
        data: {
          externalUrl: 'http://www.example.com/foobar.png',
          id: 'foobar',
          mimeType: 'image/png',
          title: 'Foobar'
        },
        type: 'document'
      };
      const result = entityToHTML(entity, 'My original text');
      expect(result).toEqual(
        '<img src="http://www.example.com/foobar.png" alt="" title="Foobar" width="60%" ' +
          'data-id="foobar" data-mimetype="image/png" />'
      );
    });

    it('should return an empty div for documents (pdf, doc, ...)', () => {
      const entity = {
        data: {
          externalUrl: 'http://www.example.com/document/1122/data',
          id: 'foobar',
          mimeType: 'application/pdf',
          title: 'foobar.pdf'
        },
        type: 'document'
      };
      const result = entityToHTML(entity, 'My original text');
      expect(result).toEqual(
        '<span class="attachment-document" data-id="foobar" data-mimetype="application/pdf" data-title="foobar.pdf" ' +
          'data-externalurl="http://www.example.com/document/1122/data">pdf</span>'
      );
    });
  });

  describe('htmlToBlock function', () => {
    const { htmlToBlock } = plugin;
    it('should return atomic block type if the node is an img tag', () => {
      const nodeName = 'img';
      const node = {};
      const lastList = null;
      const inBlock = 'unstyled';
      const result = htmlToBlock(nodeName, node, lastList, inBlock);
      const expected = 'atomic';
      expect(result).toEqual(expected);
    });

    it('should return atomic block type if the node is an atomic block', () => {
      const nodeName = 'div';
      const node = {
        dataset: {
          blocktype: 'atomic'
        },
        firstChild: {
          dataset: {
            id: 'foobar',
            mimeType: 'image/png'
          },
          nodename: 'img'
        }
      };
      const lastList = null;
      const inBlock = 'atomic';
      const result = htmlToBlock(nodeName, node, lastList, inBlock);
      const expected = 'atomic';
      expect(result).toEqual(expected);
    });
  });

  describe('htmlToEntity function', () => {
    const { htmlToEntity } = plugin;
    it('should return from HTML', () => {
      const nodeName = 'div';
      const node = {
        dataset: {
          blocktype: 'atomic'
        },
        firstChild: {
          dataset: {
            id: 'foobar',
            mimeType: 'image/png'
          },
          nodename: 'img'
        }
      };
      const result = htmlToEntity(nodeName, node, createEntity);
      const expected = '1';
      expect(result).toEqual(expected);
    });
  });

  describe('getAttachments function', () => {
    const { getAttachments } = plugin;
    it('should return the list of all attachments ids', () => {
      const result = getAttachments(rcs);
      // FIXME: entityKey values is quite unstable here. It seems that there is a side effect
      const expected = [
        { entityKey: '2', document: { id: '1234', title: 'Foobar', mimeType: 'application/pdf' } },
        { entityKey: '3', document: { id: '1236', externalUrl: 'http://www.example.com/foo.png', mimeType: 'image/png' } }
      ];
      expect(result).toEqual(expected);
    });
  });

  describe('getAttachmentsDocumentIds function', () => {
    const { getAttachmentsDocumentIds } = plugin;
    it('should return the list of all attachments ids', () => {
      const result = getAttachmentsDocumentIds(rcs);
      const expected = ['1234', '1236'];
      expect(result).toEqual(expected);
    });
  });

  describe('removeAttachment function', () => {
    const { removeAttachment } = plugin;
    it('should remove the block and entity related to the given documentId', () => {
      const cs = convertFromRaw(rcs);
      const result = convertToRaw(removeAttachment(cs, '1236'));
      const expected = {
        blocks: [
          {
            data: {},
            depth: 0,
            key: 'eokpt',
            text: 'Lorem ipsum dolor sit amet',
            type: 'unstyled',
            entityRanges: [],
            inlineStyleRanges: []
          },
          {
            data: {},
            depth: 0,
            key: '73oie',
            text: ' ',
            type: 'atomic',
            entityRanges: [{ offset: 0, length: 1, key: 0 }],
            inlineStyleRanges: []
          }
        ],
        entityMap: {
          0: {
            type: 'document',
            mutability: 'IMMUTABLE',
            data: { id: '1234', title: 'Foobar', mimeType: 'application/pdf' }
          }
        }
      };
      expect(result).toEqual(expected);
    });
  });
});