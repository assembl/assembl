// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { OverlayTrigger } from 'react-bootstrap';

import { languageTooltip } from '../common/tooltips';
import manageErrorAndLoading from '../common/manageErrorAndLoading';
import { updateEditLocale } from '../../actions/adminActions';
import DiscussionPreferences from '../../graphql/DiscussionPreferences.graphql';
import De from '../svg/flags/de';
import En from '../svg/flags/en';
import Es from '../svg/flags/es';
import Fr from '../svg/flags/fr';
import Hu from '../svg/flags/hu';
import It from '../svg/flags/it';
import Ja from '../svg/flags/ja';
import Nb from '../svg/flags/nb';
import Nl from '../svg/flags/nl';
import Pl from '../svg/flags/pl';
import Pt from '../svg/flags/pt';
import Ro from '../svg/flags/ro';
import Ru from '../svg/flags/ru';
import Th from '../svg/flags/th';
import Tr from '../svg/flags/tr';
import ZhCN from '../svg/flags/zh_CN';

type Props = {
  editLocale: string,
  discussionPreferencesLanguages: Array<{ locale: string, name: string }>,
  isHidden: boolean,
  changeLocale: string => void
};

const Flag = ({ locale }: { locale: string }) => {
  switch (locale) {
  case 'de':
    return <De />;
  case 'en':
    return <En />;
  case 'es':
    return <Es />;
  case 'fr':
    return <Fr />;
  case 'hu':
    return <Hu />;
  case 'it':
    return <It />;
  case 'ja':
    return <Ja />;
  case 'no':
    return <Nb />;
  case 'nl':
    return <Nl />;
  case 'pl':
    return <Pl />;
  case 'pt':
    return <Pt />;
  case 'ro':
    return <Ro />;
  case 'ru':
    return <Ru />;
  case 'th':
    return <Th />;
  case 'tr':
    return <Tr />;
  case 'zh_Hans':
    return <ZhCN />;
  default:
    return <span>{locale}</span>;
  }
};

const LanguageMenu = ({ changeLocale, discussionPreferencesLanguages, editLocale, isHidden }: Props) => {
  if (!isHidden) {
    return (
      <div className="relative">
        <div className="language-menu">
          <OverlayTrigger placement="top" overlay={languageTooltip}>
            <div>
              {discussionPreferencesLanguages.map((language, index) => (
                <div
                  title={language.name}
                  onClick={() => changeLocale(language.locale)}
                  id={language.locale}
                  className={editLocale === language.locale ? 'flag-container active' : 'flag-container'}
                  key={index}
                >
                  <Flag locale={language.locale} />
                </div>
              ))}
            </div>
          </OverlayTrigger>
        </div>
      </div>
    );
  }

  return <span />;
};

const mapStateToProps = state => ({
  i18n: state.i18n,
  translations: state.i18n.translations,
  editLocale: state.admin.editLocale,
  isHidden: state.admin.displayLanguageMenu
});

const mapDispatchToProps = dispatch => ({
  changeLocale: (newLocale) => {
    dispatch(updateEditLocale(newLocale));
  }
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(DiscussionPreferences, {
    options: props => ({
      variables: {
        inLocale: props.i18n.locale
      }
    }),
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading,
          discussionPreferencesLanguages: []
        };
      }

      return {
        error: data.error,
        loading: data.loading,
        discussionPreferencesLanguages: data.discussionPreferences.languages
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: false })
)(LanguageMenu);