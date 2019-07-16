import { getDebateTotalMessages, transformPosts } from '../../../js/app/pages/idea';
import {
  reverseChronologicalFlatPolicy,
  reverseChronologicalTopPolicy
} from '../../../js/app/components/debate/common/postsFilter/menu';

describe('transformPosts function', () => {
  it('should transform posts', () => {
    const messageColumnsInput = [
      {
        color: '#50D593',
        index: 0,
        messageClassifier: 'positive',
        name: 'Positif'
      },
      {
        color: '#333333',
        index: 1,
        messageClassifier: 'negative',
        name: 'Négative'
      }
    ];
    const postsInput = [
      { node: { id: '1', subject: 'One', parentId: null, messageClassifier: 'positive' } },
      { node: { id: '2', subject: 'Two', parentId: null, messageClassifier: 'negative' } },
      { node: { id: '3', subject: 'Three', parentId: null, messageClassifier: 'positive' } },
      { node: { id: '4', subject: 'Four', parentId: null, messageClassifier: 'positive' } },
      { node: { id: '5', subject: 'First child of One', parentId: '1' } },
      { node: { id: '6', subject: 'Second child of One', parentId: '1' } },
      { node: { id: '7', subject: 'First child of Two', parentId: '2' } },
      { node: { id: '8', subject: 'First grandchild of One', parentId: '5' } },
      { node: { id: '9', subject: 'Second grandchild of One', parentId: '5' } }
    ];
    const expectedOutput = [
      {
        children: [],
        colColor: '#50D593',
        colName: 'Positif',
        id: '4',
        messageClassifier: 'positive',
        parentId: null,
        subject: 'Four'
      },
      {
        children: [],
        colColor: '#50D593',
        colName: 'Positif',
        id: '3',
        messageClassifier: 'positive',
        parentId: null,
        subject: 'Three'
      },
      {
        children: [{ children: [], id: '7', parentId: '2', subject: 'First child of Two' }],
        colColor: '#333333',
        colName: 'Négative',
        id: '2',
        messageClassifier: 'negative',
        parentId: null,
        subject: 'Two'
      },
      {
        children: [
          {
            children: [
              { children: [], id: '8', parentId: '5', subject: 'First grandchild of One' },
              { children: [], id: '9', parentId: '5', subject: 'Second grandchild of One' }
            ],
            id: '5',
            parentId: '1',
            subject: 'First child of One'
          },
          { children: [], id: '6', parentId: '1', subject: 'Second child of One' }
        ],
        colColor: '#50D593',
        colName: 'Positif',
        id: '1',
        messageClassifier: 'positive',
        parentId: null,
        subject: 'One'
      }
    ];
    const output = transformPosts(postsInput, messageColumnsInput);
    expect(output).toEqual(expectedOutput);
  });

  it('should transform posts and filter out deleted top post without answers', () => {
    const postsInput = [
      { node: { id: '1', subject: 'One', parentId: null, publicationState: 'DELETED_BY_ADMIN' } },
      { node: { id: '2', subject: 'Two', parentId: null, publicationState: 'DELETED_BY_ADMIN' } },
      { node: { id: '3', subject: 'Three', parentId: null, publicationState: 'DELETED_BY_USER' } },
      { node: { id: '4', subject: 'Four', parentId: null, publicationState: 'DELETED_BY_USER' } },
      { node: { id: '5', subject: 'Five', parentId: null } },
      { node: { id: '6', subject: 'Six', parentId: null } },
      { node: { id: '7', subject: 'First child of Two', parentId: '2' } },
      { node: { id: '8', subject: 'First child of Four', parentId: '4' } },
      { node: { id: '9', subject: 'First child of Five', parentId: '5', publicationState: 'DELETED_BY_USER' } },
      { node: { id: '10', subject: 'First child of Six', parentId: '6', publicationState: 'DELETED_BY_USER' } },
      { node: { id: '11', subject: 'First grandchild of Six', parentId: '10' } }
    ];
    const expectedOutput = [
      {
        children: [
          {
            children: [{ children: [], id: '11', parentId: '10', subject: 'First grandchild of Six' }],
            id: '10',
            parentId: '6',
            publicationState: 'DELETED_BY_USER',
            subject: 'First child of Six'
          }
        ],
        id: '6',
        parentId: null,
        subject: 'Six'
      },
      {
        children: [
          {
            children: [],
            id: '9',
            parentId: '5',
            publicationState: 'DELETED_BY_USER',
            subject: 'First child of Five'
          }
        ],
        id: '5',
        parentId: null,
        subject: 'Five'
      },
      {
        children: [{ children: [], id: '8', parentId: '4', subject: 'First child of Four' }],
        id: '4',
        parentId: null,
        publicationState: 'DELETED_BY_USER',
        subject: 'Four'
      },
      {
        children: [{ children: [], id: '7', parentId: '2', subject: 'First child of Two' }],
        id: '2',
        parentId: null,
        publicationState: 'DELETED_BY_ADMIN',
        subject: 'Two'
      }
    ];
    const output = transformPosts(postsInput, []);
    expect(output).toEqual(expectedOutput);
  });

  it('should transform posts and sort by creationDate ', () => {
    const postsInput = [
      { node: { id: '1', subject: 'One', parentId: null, creationDate: '2018-01-22T15:04:01.492406+00:00' } },
      { node: { id: '3', subject: 'Three', parentId: null, creationDate: '2018-01-22T15:08:01.492406+00:00' } },
      { node: { id: '5', subject: 'Five', parentId: null, creationDate: '2018-01-23T10:16:01.492406+00:00' } },
      { node: { id: '6', subject: 'Six', parentId: null, creationDate: '2018-01-23T16:44:01.492406+00:00' } },
      { node: { id: '4', subject: 'Four', parentId: null, creationDate: '2018-01-22T15:09:01.492406+00:00' } },
      { node: { id: '2', subject: 'Two', parentId: null, creationDate: '2018-01-22T15:06:01.492406+00:00' } }
    ];
    const expectedOutput = [
      { children: [], creationDate: '2018-01-23T16:44:01.492406+00:00', id: '6', parentId: null, subject: 'Six' },
      { children: [], creationDate: '2018-01-23T10:16:01.492406+00:00', id: '5', parentId: null, subject: 'Five' },
      { children: [], creationDate: '2018-01-22T15:09:01.492406+00:00', id: '4', parentId: null, subject: 'Four' },
      { children: [], creationDate: '2018-01-22T15:08:01.492406+00:00', id: '3', parentId: null, subject: 'Three' },
      { children: [], creationDate: '2018-01-22T15:06:01.492406+00:00', id: '2', parentId: null, subject: 'Two' },
      { children: [], creationDate: '2018-01-22T15:04:01.492406+00:00', id: '1', parentId: null, subject: 'One' }
    ];
    const output = transformPosts(postsInput, []);
    expect(output).toEqual(expectedOutput);
  });
});

it('should transform posts, group, and sort by creationDate ', () => {
  const postsInput = [
    {
      node: {
        id: '1',
        subject: 'One',
        parentId: null,
        publicationState: 'DELETED_BY_ADMIN',
        creationDate: '2018-01-22T15:04:01.492406+00:00'
      }
    },
    {
      node: {
        id: '2',
        subject: 'Two',
        parentId: null,
        publicationState: 'DELETED_BY_ADMIN',
        creationDate: '2018-01-22T15:06:01.492406+00:00'
      }
    },
    {
      node: {
        id: '3',
        subject: 'Three',
        parentId: null,
        publicationState: 'DELETED_BY_USER',
        creationDate: '2018-01-22T15:08:01.492406+00:00'
      }
    },
    {
      node: {
        id: '4',
        subject: 'Four',
        parentId: null,
        publicationState: 'DELETED_BY_USER',
        creationDate: '2018-01-22T15:09:01.492406+00:00'
      }
    },
    { node: { id: '5', subject: 'Five', parentId: null, creationDate: '2018-01-23T10:16:01.492406+00:00' } },
    { node: { id: '6', subject: 'Six', parentId: null, creationDate: '2018-01-23T16:44:01.492406+00:00' } },
    {
      node: {
        id: '7',
        subject: 'First child of Two',
        parentId: '2',
        creationDate: '2018-01-23T11:18:01.492406+00:00'
      }
    },
    {
      node: {
        id: '8',
        subject: 'First child of Four',
        parentId: '4',
        creationDate: '2018-01-23T12:32:01.492406+00:00'
      }
    },
    {
      node: {
        id: '9',
        subject: 'First child of Five',
        parentId: '5',
        publicationState: 'DELETED_BY_USER',
        creationDate: '2018-01-24T11:36:01.492406+00:00'
      }
    },
    {
      node: {
        id: '10',
        subject: 'First child of Six',
        parentId: '6',
        publicationState: 'DELETED_BY_USER',
        creationDate: '2018-01-26T09:19:01.492406+00:00'
      }
    },
    {
      node: {
        id: '11',
        subject: 'First grandchild of Six',
        parentId: '10',
        creationDate: '2018-01-28T15:58:01.492406+00:00'
      }
    },
    {
      node: {
        id: '12',
        subject: 'Second child of Six',
        parentId: '6',
        creationDate: '2018-01-29T13:16:01.492406+00:00'
      }
    }
  ];
  const expectedOutput = [
    {
      children: [
        {
          children: [],
          creationDate: '2018-01-29T13:16:01.492406+00:00',
          id: '12',
          parentId: '6',
          subject: 'Second child of Six'
        },
        {
          children: [
            {
              children: [],
              creationDate: '2018-01-28T15:58:01.492406+00:00',
              id: '11',
              parentId: '10',
              subject: 'First grandchild of Six'
            }
          ],
          creationDate: '2018-01-26T09:19:01.492406+00:00',
          id: '10',
          parentId: '6',
          publicationState: 'DELETED_BY_USER',
          subject: 'First child of Six'
        }
      ],
      creationDate: '2018-01-23T16:44:01.492406+00:00',
      id: '6',
      parentId: null,
      subject: 'Six'
    },
    {
      children: [
        {
          children: [],
          creationDate: '2018-01-23T12:32:01.492406+00:00',
          id: '8',
          parentId: '4',
          subject: 'First child of Four'
        }
      ],
      creationDate: '2018-01-22T15:09:01.492406+00:00',
      id: '4',
      parentId: null,
      publicationState: 'DELETED_BY_USER',
      subject: 'Four'
    },
    {
      children: [
        {
          children: [],
          creationDate: '2018-01-23T11:18:01.492406+00:00',
          id: '7',
          parentId: '2',
          subject: 'First child of Two'
        }
      ],
      creationDate: '2018-01-22T15:06:01.492406+00:00',
      id: '2',
      parentId: null,
      publicationState: 'DELETED_BY_ADMIN',
      subject: 'Two'
    },
    {
      children: [
        {
          children: [],
          creationDate: '2018-01-24T11:36:01.492406+00:00',
          id: '9',
          parentId: '5',
          publicationState: 'DELETED_BY_USER',
          subject: 'First child of Five'
        }
      ],
      creationDate: '2018-01-23T10:16:01.492406+00:00',
      id: '5',
      parentId: null,
      subject: 'Five'
    }
  ];
  const output = transformPosts(postsInput, []);
  expect(output).toEqual(expectedOutput);
});

it('should transform posts, group, and sort by creationDate using recent latest post policy', () => {
  const postsInput = [
    {
      node: {
        id: '1',
        subject: 'One',
        parentId: null,
        publicationState: 'DELETED_BY_ADMIN',
        creationDate: '2018-01-22T15:04:01.492406+00:00'
      }
    },
    {
      node: {
        id: '2',
        subject: 'Two',
        parentId: null,
        publicationState: 'DELETED_BY_ADMIN',
        creationDate: '2018-01-22T15:06:01.492406+00:00'
      }
    },
    {
      node: {
        id: '3',
        subject: 'Three',
        parentId: null,
        publicationState: 'DELETED_BY_USER',
        creationDate: '2018-01-22T15:08:01.492406+00:00'
      }
    },
    {
      node: {
        id: '4',
        subject: 'Four',
        parentId: null,
        publicationState: 'DELETED_BY_USER',
        creationDate: '2018-01-22T15:09:01.492406+00:00'
      }
    },
    { node: { id: '5', subject: 'Five', parentId: null, creationDate: '2018-01-23T10:16:01.492406+00:00' } },
    { node: { id: '6', subject: 'Six', parentId: null, creationDate: '2018-01-23T16:44:01.492406+00:00' } },
    {
      node: {
        id: '7',
        subject: 'First child of Two',
        parentId: '2',
        creationDate: '2018-01-23T11:18:01.492406+00:00'
      }
    },
    {
      node: {
        id: '8',
        subject: 'First child of Four',
        parentId: '4',
        creationDate: '2018-01-23T12:32:01.492406+00:00'
      }
    },
    {
      node: {
        id: '9',
        subject: 'First child of Five',
        parentId: '5',
        publicationState: 'DELETED_BY_USER',
        creationDate: '2018-01-24T11:36:01.492406+00:00'
      }
    },
    {
      node: {
        id: '10',
        subject: 'First child of Six',
        parentId: '6',
        publicationState: 'DELETED_BY_USER',
        creationDate: '2018-01-26T09:19:01.492406+00:00'
      }
    },
    {
      node: {
        id: '11',
        subject: 'First grandchild of Six',
        parentId: '10',
        creationDate: '2018-01-28T15:58:01.492406+00:00'
      }
    },
    {
      node: {
        id: '12',
        subject: 'Second child of Six',
        parentId: '6',
        creationDate: '2018-01-29T13:16:01.492406+00:00'
      }
    }
  ];
  const expectedOutput = [
    {
      children: [
        {
          children: [],
          creationDate: '2018-01-29T13:16:01.492406+00:00',
          id: '12',
          parentId: '6',
          subject: 'Second child of Six'
        },
        {
          children: [
            {
              children: [],
              creationDate: '2018-01-28T15:58:01.492406+00:00',
              id: '11',
              parentId: '10',
              subject: 'First grandchild of Six'
            }
          ],
          creationDate: '2018-01-26T09:19:01.492406+00:00',
          id: '10',
          parentId: '6',
          publicationState: 'DELETED_BY_USER',
          subject: 'First child of Six'
        }
      ],
      creationDate: '2018-01-23T16:44:01.492406+00:00',
      id: '6',
      parentId: null,
      subject: 'Six'
    },
    {
      children: [
        {
          children: [],
          creationDate: '2018-01-24T11:36:01.492406+00:00',
          id: '9',
          parentId: '5',
          publicationState: 'DELETED_BY_USER',
          subject: 'First child of Five'
        }
      ],
      creationDate: '2018-01-23T10:16:01.492406+00:00',
      id: '5',
      parentId: null,
      subject: 'Five'
    },
    {
      children: [
        {
          children: [],
          creationDate: '2018-01-23T12:32:01.492406+00:00',
          id: '8',
          parentId: '4',
          subject: 'First child of Four'
        }
      ],
      creationDate: '2018-01-22T15:09:01.492406+00:00',
      id: '4',
      parentId: null,
      publicationState: 'DELETED_BY_USER',
      subject: 'Four'
    },
    {
      children: [
        {
          children: [],
          creationDate: '2018-01-23T11:18:01.492406+00:00',
          id: '7',
          parentId: '2',
          subject: 'First child of Two'
        }
      ],
      creationDate: '2018-01-22T15:06:01.492406+00:00',
      id: '2',
      parentId: null,
      publicationState: 'DELETED_BY_ADMIN',
      subject: 'Two'
    }
  ];
  const output = transformPosts(postsInput, [], {
    postsOrderPolicy: reverseChronologicalTopPolicy
  });
  expect(output).toEqual(expectedOutput);
});

it('should transform posts, flatten using a policy without postsGroupPolicy', () => {
  expect(reverseChronologicalFlatPolicy.postsGroupPolicy).toBeNull();
  const postsInput = [
    {
      node: {
        id: '1',
        subject: 'One',
        parentId: null,
        publicationState: 'DELETED_BY_ADMIN',
        creationDate: '2018-01-22T15:04:01.492406+00:00'
      }
    },
    {
      node: {
        id: '2',
        subject: 'Two',
        parentId: null,
        publicationState: 'DELETED_BY_ADMIN',
        creationDate: '2018-01-22T15:06:01.492406+00:00'
      }
    },
    {
      node: {
        id: '3',
        subject: 'Three',
        parentId: null,
        publicationState: 'DELETED_BY_USER',
        creationDate: '2018-01-22T15:08:01.492406+00:00'
      }
    },
    {
      node: {
        id: '4',
        subject: 'Four',
        parentId: null,
        publicationState: 'DELETED_BY_USER',
        creationDate: '2018-01-22T15:09:01.492406+00:00'
      }
    },
    { node: { id: '5', subject: 'Five', parentId: null, creationDate: '2018-01-23T10:16:01.492406+00:00' } },
    {
      node: {
        id: '6',
        subject: 'First child of Two',
        parentId: '2',
        creationDate: '2018-01-23T11:18:01.492406+00:00'
      }
    },
    {
      node: {
        id: '7',
        subject: 'First child of Four',
        parentId: '4',
        creationDate: '2018-01-23T12:32:01.492406+00:00'
      }
    },
    { node: { id: '8', subject: 'Six', parentId: null, creationDate: '2018-01-23T16:44:01.492406+00:00' } },
    {
      node: {
        id: '9',
        subject: 'First child of Five',
        parentId: '5',
        publicationState: 'DELETED_BY_USER',
        creationDate: '2018-01-24T11:36:01.492406+00:00'
      }
    },
    {
      node: {
        id: '10',
        subject: 'First child of Six',
        parentId: '6',
        publicationState: 'DELETED_BY_USER',
        creationDate: '2018-01-26T09:19:01.492406+00:00'
      }
    }
  ];
  const expectedOutput = [
    {
      children: [],
      creationDate: '2018-01-23T10:16:01.492406+00:00',
      id: '5',
      parentId: null,
      subject: 'Five'
    },
    {
      children: [],
      creationDate: '2018-01-23T11:18:01.492406+00:00',
      id: '6',
      parentId: '2',
      subject: 'First child of Two'
    },
    {
      children: [],
      creationDate: '2018-01-23T12:32:01.492406+00:00',
      id: '7',
      parentId: '4',
      subject: 'First child of Four'
    },
    {
      children: [],
      creationDate: '2018-01-23T16:44:01.492406+00:00',
      id: '8',
      parentId: null,
      subject: 'Six'
    }
  ];
  const output = transformPosts(postsInput, [], {
    postsOrderPolicy: reverseChronologicalFlatPolicy
  });
  expect(output).toEqual(expectedOutput);
});

describe('getFictionDebateTotalMessages function', () => {
  const childrenNode = { children: [] };

  it('should return 0 when array is empty', () => {
    const array = [];
    expect(getDebateTotalMessages(array)).toEqual(0);
  });

  it('should return 1 message', () => {
    const array = [childrenNode];
    expect(getDebateTotalMessages(array)).toEqual(1);
  });

  it('should return 3 messages (with level 1 children embedded)', () => {
    const array = [
      childrenNode,
      {
        children: [childrenNode]
      }
    ];
    expect(getDebateTotalMessages(array)).toEqual(3);
  });

  it('should return 5 messages (with level 2 children embedded)', () => {
    const array = [
      childrenNode,
      {
        children: [
          childrenNode,
          {
            children: [childrenNode]
          }
        ]
      }
    ];
    expect(getDebateTotalMessages(array)).toEqual(5);
  });

  it('should return 7 messages (with level 3 children embedded)', () => {
    const array = [
      childrenNode,
      {
        children: [
          childrenNode,
          {
            children: [
              childrenNode,
              {
                children: [childrenNode]
              }
            ]
          }
        ]
      }
    ];
    expect(getDebateTotalMessages(array)).toEqual(7);
  });

  it('should return 9 messages (with level 4 children embedded)', () => {
    const array = [
      childrenNode,
      {
        children: [
          childrenNode,
          {
            children: [
              childrenNode,
              {
                children: [
                  childrenNode,
                  {
                    children: [childrenNode]
                  }
                ]
              }
            ]
          }
        ]
      }
    ];
    expect(getDebateTotalMessages(array)).toEqual(9);
  });
});