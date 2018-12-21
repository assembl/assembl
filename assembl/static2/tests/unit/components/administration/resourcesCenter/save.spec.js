// @flow
import { client } from '../../../../helpers/graphql';
import { createMutationsPromises } from '../../../../../js/app/components/administration/resourcesCenter/save';
import { createEditorStateFromText } from '../../../../helpers/draftjs';

/*
 This test is quite noisy. We have lots of warnings from react-apollo because of this issue:
 https://github.com/apollographql/react-apollo/issues/1747
*/

describe('createMutationsPromises function', () => {
  it('should create an array of mutation promises', async () => {
    const initialValues = {
      pageTitle: {
        en: 'Resources center',
        fr: 'Centre de ressources'
      },
      pageHeader: null,
      resources: [
        {
          doc: null,
          embedCode: '<iframe></iframe>',
          id: 'resource-to-delete',
          img: null,
          title: {
            en: 'Resource to delete'
          },
          text: {}
        },
        {
          doc: null,
          embedCode: '<iframe></iframe>',
          id: 'resource-to-update',
          img: null,
          title: {
            en: 'Resource to update'
          },
          text: {
            en: createEditorStateFromText('Please update me')
          }
        }
      ]
    };

    const values = {
      pageTitle: {
        en: 'Resources center',
        fr: 'Centre de ressources'
      },
      pageHeader: null,
      resources: [
        {
          doc: null,
          embedCode: '',
          id: '-1234',
          img: null,
          title: {
            en: 'My new resource',
            fr: 'Ma nouvelle ressource'
          },
          text: {}
        },
        {
          doc: null,
          embedCode: '<iframe></iframe>',
          id: 'resource-to-update',
          img: null,
          title: {
            en: 'Resource to update',
            fr: 'Ressource à mettre à jour'
          },
          text: {
            en: createEditorStateFromText('After update'),
            fr: createEditorStateFromText('Après mise à jour')
          }
        }
      ]
    };

    const mutations = createMutationsPromises(client, 'en')(values, initialValues);

    const updateResourcesCenterMutation = mutations[0];
    const urcResult = await updateResourcesCenterMutation();
    expect(urcResult).toEqual({
      data: {
        updateResourcesCenter: {
          resourcesCenter: {
            titleEntries: [{ localeCode: 'en', value: 'Resources center' }, { localeCode: 'fr', value: 'Centre de ressources' }],
            headerImage: null
          }
        }
      }
    });

    const deleteResourceMutation = mutations[1];
    const deleteResourceResult = await deleteResourceMutation();
    expect(deleteResourceResult).toEqual({
      data: {
        deleteResource: {
          success: true
        }
      }
    });

    const createResourceMutation = mutations[2];
    const createResourceResult = await createResourceMutation();
    expect(createResourceResult).toEqual({
      data: {
        createResource: {
          resource: {
            doc: null,
            embedCode: '',
            id: 'UTIESRN83X',
            image: null,
            order: 1.0,
            text: '',
            textEntries: [],
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
            ]
          }
        }
      }
    });

    const updateResourceMutation = mutations[3];
    const updateResourceResult = await updateResourceMutation();
    expect(updateResourceResult).toEqual({
      data: {
        updateResource: {
          resource: {
            doc: null,
            embedCode: '<iframe></iframe>',
            id: 'resource-to-update',
            image: null,
            order: 2,
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
    });
  });
});