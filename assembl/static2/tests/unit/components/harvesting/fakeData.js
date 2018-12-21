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
      isMachine: false,
      userId: 31
    },
    extractAction: null,
    extractNature: null,
    id: '987643',
    important: false,
    lang: 'fr',
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
      isMachine: false,
      userId: 29
    },
    extractAction: null,
    extractNature: null,
    id: '75432',
    important: false,
    lang: 'fr',
    textFragmentIdentifiers: [
      {
        offsetEnd: 123,
        offsetStart: 22,
        xpathEnd: `//div[@id='${getExtractTagId(3050)}']/`,
        xpathStart: `//div[@id='${getExtractTagId(3050)}']/`
      }
    ]
  },
  {
    body: 'extracted text',
    creationDate: '2018-05-29T16:28:27.324276+00:00',
    creator: {
      displayName: 'John Doe',
      id: '1223456',
      isMachine: false,
      userId: 31
    },
    extractAction: 'Enum.classify',
    extractNature: 'Enum.concept',
    extractState: 'PUBLISHED',
    id: '778899',
    important: false,
    lang: 'en',
    textFragmentIdentifiers: [
      {
        offsetEnd: 14,
        offsetStart: 6,
        xpathEnd: `//span[@id='${getExtractTagId(1010)}']/`,
        xpathStart: `//span[@id='${getExtractTagId(1010)}']/`
      }
    ]
  },
  {
    body: 'extracted by machine (submitted)',
    creationDate: '2018-04-01T13:00:27.324276+00:00',
    creator: {
      displayName: 'Robot',
      id: '880088',
      isMachine: true,
      userId: 42
    },
    extractAction: null,
    extractNature: 'Enum.actionable_solution',
    extractState: 'SUBMITTED',
    id: '112233',
    important: false,
    lang: 'en',
    textFragmentIdentifiers: [
      {
        offsetEnd: 8,
        offsetStart: 0,
        xpathEnd: `//div[@id='${getExtractTagId(2020)}']/`,
        xpathStart: `//div[@id='${getExtractTagId(2020)}']/`
      }
    ]
  },
  {
    body: 'extracted by machine (validated)',
    creationDate: '2018-04-02T13:00:00.324276+00:00',
    creator: {
      displayName: 'Robot',
      id: '880088',
      isMachine: true,
      userId: 42
    },
    extractAction: null,
    extractNature: 'Enum.actionable_solution',
    extractState: 'PUBLISHED',
    id: '223344',
    important: false,
    lang: 'en',
    textFragmentIdentifiers: [
      {
        offsetEnd: 5,
        offsetStart: 0,
        xpathEnd: `//span[@id='${getExtractTagId(1010)}']/`,
        xpathStart: `//span[@id='${getExtractTagId(1010)}']/`
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