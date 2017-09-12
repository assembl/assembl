import plugin from '../../../../../js/app/components/common/richTextEditor/attachmentsPlugin';

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
      entityRanges: [{ offset: 0, length: 1, key: 3 }],
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
      data: { id: '1234' }
    },
    3: {
      type: 'document',
      mutability: 'IMMUTABLE',
      data: { id: '1236', externalUrl: 'http://www.example.com' }
    }
  }
};

describe('attachmentsPlugin', () => {
  describe('blockToHTML function', () => {
    const { blockToHTML } = plugin;
    it('should return null for non atomic block', () => {
      const block = {
        type: 'unstyled'
      };
      const result = blockToHTML(block);
      expect(result).toBeNull();
    });

    it('should return null for non atomic block', () => {
      const block = {
        type: 'atomic'
      };
      const result = blockToHTML(block);
      const expected = {
        start: '<div data-blockType="atomic">',
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
          'data-id="foobar" data-mimeType="image/png" />'
      );
    });

    it('should return an empty div for documents (pdf, doc, ...)', () => {
      const entity = {
        data: {
          externalUrl: 'http://www.example.com/document/1122/data',
          id: 'foobar',
          mimeType: 'application/pdf',
          title: 'Foobar'
        },
        type: 'document'
      };
      const result = entityToHTML(entity, 'My original text');
      expect(result).toEqual(
        '<div data-id="foobar" data-mimeType="application/pdf" data-title="Foobar" ' +
          'data-externalUrl="http://www.example.com/document/1122/data" />'
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
          blockType: 'atomic'
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
          blockType: 'atomic'
        },
        firstChild: {
          dataset: {
            id: 'foobar',
            mimeType: 'image/png'
          },
          nodename: 'img'
        }
      };
      const result = htmlToEntity(nodeName, node);
      const expected = '1';
      expect(result).toEqual(expected);
    });
  });

  describe('getAttachments function', () => {
    const { getAttachments } = plugin;
    it('should return the list of all attachments ids', () => {
      const result = getAttachments(rcs);
      const expected = ['1234', '1236'];
      expect(result).toEqual(expected);
    });
  });

  describe('removeAttachment function', () => {
    const { removeAttachment } = plugin;
    it('should remove the block and entity related to the given documentId', () => {
      const result = removeAttachment(rcs, '1236');
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
            text: '',
            type: 'unstyled',
            entityRanges: [],
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
            data: { id: '1234' }
          }
        }
      };
      expect(result).toEqual(expected);
    });
  });
});