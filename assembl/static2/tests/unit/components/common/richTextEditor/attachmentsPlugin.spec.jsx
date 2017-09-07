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