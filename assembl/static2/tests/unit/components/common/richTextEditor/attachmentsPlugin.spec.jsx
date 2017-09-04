import plugin from '../../../../../js/app/components/common/richTextEditor/attachmentsPlugin';

describe('attachmentsPlugin', () => {
  describe('getAttachments function', () => {
    const { getAttachments } = plugin;
    it('should return the list of all attachments ids', () => {
      const rcs = {
        blocks: [
          {
            text: 'Lorem ipsum dolor sit amet',
            type: 'unstyled',
            entityRanges: []
          },
          {
            text: ' ',
            type: 'atomic',
            entityRanges: [{ offset: 0, length: 1, key: 'first' }]
          },
          {
            text: ' ',
            type: 'atomic',
            entityRanges: [{ offset: 0, length: 1, key: 'third' }]
          }
        ],
        entityMap: {
          first: {
            type: 'document',
            mutability: 'IMMUTABLE',
            data: { id: '1234' }
          },
          third: {
            type: 'link',
            mutability: 'IMMUTABLE',
            data: { id: '1236', url: 'http://www.example.com' }
          }
        }
      };

      const result = getAttachments(rcs);
      const expected = ['1234', '1236'];
      expect(result).toEqual(expected);
    });
  });
});