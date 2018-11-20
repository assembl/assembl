// @flow
import * as save from '../../../../../js/app/components/administration/legalContents/save';
import { createEditorStateFromText } from '../../../../helpers/draftjs';
import { client } from '../../../../helpers/graphql';

describe('createMutationsPromises function', () => {
  const { createMutationsPromises } = save;
  it('should create an array of mutation promises', async () => {
    const values = {
      legalNotice: {
        en: createEditorStateFromText('text in english'),
        fr: createEditorStateFromText('texte en français')
      },
      termsAndConditions: {},
      cookiesPolicy: {},
      privacyPolicy: {},
      userGuidelines: {}
    };
    const mutations = createMutationsPromises(client, 'en')(values);
    const updateLegalContentsResult = await mutations[0]();
    expect(updateLegalContentsResult).toEqual({
      data: {
        updateLegalContents: {
          legalContents: {
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
            cookiesPolicyEntries: [],
            privacyPolicyEntries: [],
            userGuidelinesEntries: []
          }
        }
      }
    });
  });
});