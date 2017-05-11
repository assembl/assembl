import React from 'react';
import renderer from 'react-test-renderer';

import SectionTitle from '../../../../js/app/components/administration/sectionTitle';

describe('SectionTitle component', () => {
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
    const component = renderer.create(<SectionTitle i18n={i18n} phase="survey" tabId="0" annotation="foobar" />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});