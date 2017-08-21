import { transformPosts } from '../../../js/app/pages/idea';

describe('transformPosts function', () => {
  it('should transform posts', () => {
    const input = [
      { id: '1', subject: 'One', parentId: null },
      { id: '2', subject: 'Two', parentId: null },
      { id: '3', subject: 'Three', parentId: null },
      { id: '4', subject: 'Four', parentId: null },
      { id: '5', subject: 'First child of One', parentId: '1' },
      { id: '6', subject: 'Second child of One', parentId: '1' },
      { id: '7', subject: 'First child of Two', parentId: '2' },
      { id: '8', subject: 'First grandchild of One', parentId: '5' },
      { id: '9', subject: 'Second grandchild of One', parentId: '5' }
    ];
    const expectedOutput = [
      {
        children: [
          {
            children: [
              { children: [], id: '8', subject: 'First grandchild of One', parentId: '5' },
              { children: [], id: '9', subject: 'Second grandchild of One', parentId: '5' }
            ],
            id: '5',
            subject: 'First child of One',
            parentId: '1'
          },
          { children: [], id: '6', subject: 'Second child of One', parentId: '1' }
        ],
        id: '1',
        subject: 'One',
        parentId: null
      },
      {
        children: [{ children: [], id: '7', subject: 'First child of Two', parentId: '2' }],
        id: '2',
        subject: 'Two',
        parentId: null
      },
      { children: [], id: '3', subject: 'Three', parentId: null },
      { children: [], id: '4', subject: 'Four', parentId: null }
    ];
    const output = transformPosts(input);
    expect(output).toEqual(expectedOutput);
  });
});