/* Helpers for tests involving graphql/apollo */
import { ApolloClient } from 'react-apollo';
import { mockNetworkInterface } from 'react-apollo/test-utils';

import CreateResource from '../../js/app/graphql/mutations/createResource.graphql';
import DeleteResource from '../../js/app/graphql/mutations/deleteResource.graphql';
import UpdateResource from '../../js/app/graphql/mutations/updateResource.graphql';
import UpdateResourcesCenter from '../../js/app/graphql/mutations/updateResourcesCenter.graphql';
import UpdateLegalContents from '../../js/app/graphql/mutations/updateLegalContents.graphql';
import ResourcesCenterPage from '../../js/app/graphql/ResourcesCenterPage.graphql';
import UploadDocument from '../../js/app/graphql/mutations/uploadDocument.graphql';

const fileB64 = window.btoa('gimme some base64');
export const docFile = new File([fileB64], 'my-file.pdf');
docFile.id = '2';
export const imgFile = new File([fileB64], 'my-img.png');
imgFile.id = '1';

const MockedResponses = [
  // documents
  {
    request: {
      query: UploadDocument,
      variables: {
        file: imgFile
      }
    },
    result: {
      data: {
        uploadDocument: {
          document: {
            id: btoa('Document:1'),
            externalUrl: '/data/my-img.png',
            mimeType: 'image/png',
            title: 'My great image',
            __typename: 'Document'
          }
        }
      }
    }
  },
  {
    request: {
      query: UploadDocument,
      variables: {
        file: docFile
      }
    },
    result: {
      data: {
        uploadDocument: {
          document: {
            id: btoa('Document:2'),
            externalUrl: '/data/my-doc.pdf',
            mimeType: 'application/pdf',
            title: 'My great document',
            __typename: 'Document'
          }
        }
      }
    }
  },
  // resources center
  {
    request: {
      query: ResourcesCenterPage,
      variables: {
        lang: 'en'
      }
    },
    result: {
      data: {
        resourcesCenter: {
          title: 'My RC',
          titleEntries: [],
          headerImage: null
        }
      }
    }
  },
  {
    request: {
      query: UpdateResourcesCenter,
      variables: {
        titleEntries: [{ localeCode: 'en', value: 'Resources center' }, { localeCode: 'fr', value: 'Centre de ressources' }],
        headerImage: null
      }
    },
    result: {
      data: {
        updateResourcesCenter: {
          resourcesCenter: {
            titleEntries: [{ localeCode: 'en', value: 'Resources center' }, { localeCode: 'fr', value: 'Centre de ressources' }],
            headerImage: null
          }
        }
      }
    }
  },
  {
    request: {
      query: DeleteResource,
      variables: {
        resourceId: 'resource-to-delete'
      }
    },
    result: {
      data: {
        deleteResource: {
          success: true
        }
      }
    }
  },
  {
    request: {
      query: CreateResource,
      variables: {
        lang: 'en',
        doc: null,
        embedCode: '',
        image: null,
        textAttachments: [],
        textEntries: [],
        titleEntries: [
          {
            localeCode: 'en',
            value: 'My new resource'
          },
          {
            localeCode: 'fr',
            value: 'Ma nouvelle ressource'
          }
        ],
        order: 1
      }
    },
    result: {
      data: {
        createResource: {
          resource: {
            doc: null,
            id: 'UTIESRN83X',
            image: null,
            title: 'My new resource',
            titleEntries: [
              {
                localeCode: 'en',
                value: 'My new resource'
              },
              {
                localeCode: 'fr',
                value: 'Ma nouvelle ressource'
              }
            ],
            text: '',
            textEntries: [],
            embedCode: '',
            order: 1.0
          }
        }
      }
    }
  },
  {
    request: {
      query: UpdateResource,
      variables: {
        id: 'resource-to-update',
        lang: 'en',
        doc: null,
        embedCode: '<iframe></iframe>',
        image: null,
        textAttachments: [],
        textEntries: [
          {
            localeCode: 'en',
            value: '<p>After update</p>'
          },
          {
            localeCode: 'fr',
            value: '<p>Après mise à jour</p>'
          }
        ],
        titleEntries: [
          {
            localeCode: 'en',
            value: 'Resource to update'
          },
          {
            localeCode: 'fr',
            value: 'Ressource à mettre à jour'
          }
        ],
        order: null
      }
    },
    result: {
      data: {
        updateResource: {
          resource: {
            doc: null,
            embedCode: '<iframe></iframe>',
            id: 'resource-to-update',
            image: null,
            order: 2.0,
            text: '<p>After update</p>',
            textEntries: [
              {
                localeCode: 'fr',
                value: '<p>Après mise à jour</p>'
              },
              {
                localeCode: 'en',
                value: '<p>After update</p>'
              }
            ],
            title: 'Resource to update',
            titleEntries: [
              {
                localeCode: 'en',
                value: 'Resource to update'
              },
              {
                localeCode: 'fr',
                value: 'Ressource à mettre à jour'
              }
            ]
          }
        }
      }
    }
  },
  {
    request: {
      query: UpdateLegalContents,
      variables: {
        mandatoryLegalContentsValidation: true,
        cookiesPolicyAttachments: [],
        legalNoticeAttachments: [],
        privacyPolicyAttachments: [],
        termsAndConditionsAttachments: [],
        userGuidelinesAttachments: [],
        cookiesPolicyEntries: [],
        legalNoticeEntries: [
          {
            localeCode: 'en',
            value: '<p>text in english</p>'
          },
          {
            localeCode: 'fr',
            value: '<p>texte en français</p>'
          }
        ],
        termsAndConditionsEntries: [],
        privacyPolicyEntries: [],
        userGuidelinesEntries: []
      }
    },
    result: {
      data: {
        updateLegalContents: {
          legalContents: {
            mandatoryLegalContentsValidation: true,
            cookiesPolicyAttachments: [],
            legalNoticeAttachments: [],
            privacyPolicyAttachments: [],
            termsAndConditionsAttachments: [],
            userGuidelinesAttachments: [],
            cookiesPolicyEntries: [],
            legalNoticeEntries: [
              {
                localeCode: 'en',
                value: '<p>text in english</p>'
              },
              {
                localeCode: 'fr',
                value: '<p>texte en français</p>'
              }
            ],
            privacyPolicyEntries: [],
            termsAndConditionsEntries: [],
            userGuidelinesEntries: []
          }
        }
      }
    }
  }
];

const mockedNetworkInterface = mockNetworkInterface(...MockedResponses);

export const client = new ApolloClient({
  addTypename: false,
  networkInterface: mockedNetworkInterface
});