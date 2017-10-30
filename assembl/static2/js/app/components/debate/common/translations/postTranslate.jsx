// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';

import { updateContentLocaleById, updateContentLocaleByOriginalLocale } from '../../../../actions/contentLocaleActions';
import LocalesQuery from '../../../../graphql/LocalesQuery.graphql';
import SwitchButton from '../../../common/switchButton';
import withoutLoadingIndicator from '../../../common/withoutLoadingIndicator';
import { getConnectedUserId } from '../../../../utils/globalFunctions';
import { displayCustomModal } from '../../../../utils/utilityManager';
import CancelTranslationForm from './cancelTranslationForm';
import ChooseContentLocaleForm from './chooseContentLocaleForm';

type PostTranslateProps = {
  contentLocale: string,
  data: Object,
  id: string,
  lang: string,
  originalLocale: string,
  translate: boolean,
  updateById: (value: string) => void,
  updateByOriginalLocale: (value: string) => void
};

type PostTranslateState = {
  isTranslated: boolean
};

class PostTranslate extends React.Component<void, PostTranslateProps, PostTranslateState> {
  props: PostTranslateProps;
  state: PostTranslateState;
  originalLocaleLabel: '';

  constructor() {
    super();
    this.state = {
      isTranslated: false
    };
  }

  componentWillMount() {
    this.updateOriginalLocaleLabel(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.lang !== this.props.lang) {
      this.updateOriginalLocaleLabel(nextProps);
    }
  }

  updateOriginalLocaleLabel(props: PostTranslateProps) {
    // TODO: i'm aware that it is costly to use .find for each post. The improvement
    // I imagine is to use redux to store the locales as a mapping but the main obstacle
    // is to find which component should do the graphql query to update the redux store
    const originalLocaleInfo = props.data.locales.find((locale) => {
      return locale.localeCode === props.originalLocale;
    });
    if (originalLocaleInfo) {
      this.originalLocaleLabel = originalLocaleInfo.label;
    }
  }

  handleSubmit = () => {
    const { contentLocale, lang, originalLocale, updateById } = this.props;
    const userIsConnected = getConnectedUserId();
    if (!userIsConnected) {
      if (contentLocale && contentLocale !== lang) {
        updateById(lang);
      } else {
        updateById(originalLocale);
      }
    } else {
      this.openModal();
    }
  };

  openModal = () => {
    const { data, id, lang, originalLocale, translate, updateById, updateByOriginalLocale } = this.props;
    let content;
    if (!translate) {
      content = (
        <ChooseContentLocaleForm
          allLocales={data.locales}
          id={id}
          lang={lang}
          originalLocale={originalLocale}
          originalLocaleLabel={this.originalLocaleLabel}
          translate={translate}
          updateById={updateById}
          updateByOriginalLocale={updateByOriginalLocale}
        />
      );
    } else {
      content = (
        <CancelTranslationForm
          lang={lang}
          originalLocale={originalLocale}
          originalLocaleLabel={this.originalLocaleLabel}
          translate={translate}
          updateById={updateById}
          updateByOriginalLocale={updateByOriginalLocale}
        />
      );
    }

    return displayCustomModal(content);
  };

  render() {
    const { contentLocale, id, lang, originalLocale, translate } = this.props;
    const specialLocaleCodes = ['und', 'zxx']; // locale codes that can not be translated (unrecognized locales)
    // we need to display the component if the content was originaly in the language of the site but was previously translated:
    const isInInterfaceLanguage = originalLocale === lang && originalLocale === contentLocale;
    const showPostTranslate = !isInInterfaceLanguage && specialLocaleCodes.indexOf(originalLocale) === -1;
    if (!showPostTranslate) {
      return null;
    }
    const displayPostLanguage = translate || originalLocale !== lang;
    return (
      <div className="translate">
        {displayPostLanguage
          ? <p>
            <Translate
              value={translate ? 'debate.thread.messageTranslatedFrom' : 'debate.thread.messageOriginallyIn'}
              language={this.originalLocaleLabel}
            />
          </p>
          : null}
        <SwitchButton
          name={`switch-${id}`}
          onChange={this.handleSubmit}
          checked={translate}
          labelRight={I18n.t('debate.thread.translate')}
        />
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    updateById: (value) => {
      return dispatch(updateContentLocaleById(ownProps.id, value));
    },
    updateByOriginalLocale: (value) => {
      return dispatch(updateContentLocaleByOriginalLocale(ownProps.originalLocale, value));
    }
  };
};

export default compose(
  graphql(LocalesQuery, {
    // $FlowFixMe (flow, eslint (and even prettier!) are kind of conflicting here)
    options: () => {
      return { notifyOnNetworkStatusChange: true };
    }
  }),
  connect(null, mapDispatchToProps),
  withoutLoadingIndicator()
)(PostTranslate);