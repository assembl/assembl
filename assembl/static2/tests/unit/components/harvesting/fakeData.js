import { getExtractTagId } from '../../../../js/app/utils/extract';

const tags = [{ value: 'foo', id: 'fooid' }, { value: 'bar', id: 'barid' }];

export const extracts = [
  {
    body: 'Hello world!',
    tags: tags,
    creationDate: '2018-03-29T16:28:27.324276+00:00',
    creator: {
      displayName: 'John Doe',
      id: '1223456',
      userId: 31
    },
    extractAction: null,
    extractNature: null,
    id: '987643',
    important: false,
    textFragmentIdentifiers: [
      {
        offsetEnd: 988,
        offsetStart: 973,
        xpathEnd: `//div[@id='${getExtractTagId(3059)}']/`,
        xpathStart: `//div[@id='${getExtractTagId(3059)}']/`
      }
    ]
  },
  {
    body: 'Hello everybody!',
    tags: [],
    creationDate: '2018-04-29T16:28:27.324276+00:00',
    creator: {
      displayName: 'Alice Thomas',
      id: '78965',
      userId: 29
    },
    extractAction: null,
    extractNature: null,
    id: '75432',
    important: false,
    textFragmentIdentifiers: [
      {
        offsetEnd: 123,
        offsetStart: 22,
        xpathEnd: `//div[@id='${getExtractTagId(3050)}']/`,
        xpathStart: `//div[@id='${getExtractTagId(3050)}']/`
      }
    ]
  }
];

export const extract = {
  body: 'Hello world!',
  creationDate: '2018-03-29T16:28:27.324276+00:00',
  creator: {
    displayName: 'John Doe',
    id: '1223456',
    userId: 31
  },
  extractAction: null,
  extractNature: null,
  id: '987643',
  important: false,
  textFragmentIdentifiers: [
    {
      offsetEnd: 988,
      offsetStart: 973,
      xpathEnd: `//div[@id='${getExtractTagId(3059)}']/`,
      xpathStart: `//div[@id='${getExtractTagId(3059)}']/`
    }
  ]
};

export const submittedExtract = {
  body: 'Hello world!',
  creationDate: '2018-03-29T16:28:27.324276+00:00',
  creator: {
    displayName: 'John Doe',
    id: '1223456',
    userId: 31
  },
  extractAction: null,
  extractNature: null,
  extractState: 'SUBMITTED',
  id: '987643',
  important: false,
  textFragmentIdentifiers: [
    {
      offsetEnd: 988,
      offsetStart: 973,
      xpathEnd: `//div[@id='${getExtractTagId(3059)}']/`,
      xpathStart: `//div[@id='${getExtractTagId(3059)}']/`
    }
  ]
};