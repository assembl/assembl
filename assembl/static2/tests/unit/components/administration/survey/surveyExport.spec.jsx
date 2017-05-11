import React from 'react';
import renderer from 'react-test-renderer';

import SurveyExport from '../../../../../js/app/components/administration/survey/surveyExport';

describe('SurveyExport component', () => {
  it('should render an admin section title', () => {
    const i18n = {
      locale: 'fr',
      translations: {
        en: {
          administration: {
            survey: {
              0: 'My section title'
            }
          }
        },
        fr: {
          administration: {
            survey: {
              0: 'Mon titre de section'
            }
          }
        }
      }
    };
    const component = renderer.create(<SurveyExport i18n={i18n} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});