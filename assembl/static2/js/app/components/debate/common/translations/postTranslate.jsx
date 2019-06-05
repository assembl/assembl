// @flow
import * as React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';

import { updateContentLocaleById, updateContentLocaleByOriginalLocale } from '../../../../actions/contentLocaleActions';
import LocalesQuery from '../../../../graphql/LocalesQuery.graphql';
import manageErrorAndLoading from '../../../common/manageErrorAndLoading';
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
  updateByOriginalLocale: (value: string) => void,
  afterLoad: () => void,
  onTranslate?: (from: string, into: string) => void
};

type PostTranslateState = {
  isTranslated: boolean
};

class PostTranslate extends React.Component<PostTranslateProps, PostTranslateState> {
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
    let originalLocale = props.originalLocale;
    if (props.originalLocale && props.originalLocale.slice(0, 2) === 'zh') {
      originalLocale = 'zh_Hans';
    }
    const originalLocaleInfo = props.data.locales.find(locale => locale.localeCode === originalLocale);
    if (originalLocaleInfo) {
      this.originalLocaleLabel = originalLocaleInfo.label.split(' (')[0]; // shorten the name
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
    const { data, id, lang, originalLocale, translate, updateById, updateByOriginalLocale, onTranslate } = this.props;
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
          onTranslate={onTranslate}
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
    const { contentLocale, lang, originalLocale, translate } = this.props;
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
        {displayPostLanguage ? (
          <p>
            <Translate
              value={translate ? 'debate.thread.messageTranslatedFrom' : 'debate.thread.messageOriginallyIn'}
              language={this.originalLocaleLabel}
            />
          </p>
        ) : null}
        <span className="translate-button" onClick={this.handleSubmit}>
          <Translate
            value={translate ? 'debate.thread.removeTranslation' : 'debate.thread.translate'}
            ref={this.props.afterLoad}
          />
        </span>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  updateById: value => dispatch(updateContentLocaleById(ownProps.id, value)),
  updateByOriginalLocale: value => dispatch(updateContentLocaleByOriginalLocale(ownProps.originalLocale, value))
});

export default compose(
  graphql(LocalesQuery, {
    // $FlowFixMe (flow, eslint (and even prettier!) are kind of conflicting here)
    options: () => ({ notifyOnNetworkStatusChange: true })
  }),
  connect(null, mapDispatchToProps),
  manageErrorAndLoading({ displayLoader: false })
)(PostTranslate);