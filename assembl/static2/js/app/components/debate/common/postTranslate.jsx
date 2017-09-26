// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';

import SwitchButton from '../../common/switchButton';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { displayCustomModal } from '../../../utils/utilityManager';
import CancelTranslationForm from './cancelTranslationForm';
import ChooseContentLocaleForm from './chooseContentLocaleForm';
import { setContentLocale } from '../../../actions/contentLocaleActions';

type PostTranslateProps = {
  contentLocale: string,
  id: string,
  lang: string,
  originalLocale: string,
  translate: boolean,
  updateLocalContentLocale: Function,
  updateGlobalContentLocale: Function
};

type PostTranslateState = {
  isTranslated: boolean
};

class PostTranslate extends React.Component<void, PostTranslateProps, PostTranslateState> {
  props: PostTranslateProps;
  state: PostTranslateState;

  constructor() {
    super();
    this.state = {
      isTranslated: false
    };
  }

  handleSubmit = () => {
    const { contentLocale, lang, updateLocalContentLocale } = this.props;
    const userIsConnected = getConnectedUserId();
    if (!userIsConnected) {
      if (contentLocale && contentLocale !== lang) {
        updateLocalContentLocale(lang);
      } else {
        updateLocalContentLocale(undefined);
      }
    } else {
      this.openModal();
    }
  };

  openModal = () => {
    const { lang, originalLocale, translate, updateGlobalContentLocale, updateLocalContentLocale } = this.props;
    let content;
    if (!translate) {
      content = (
        <ChooseContentLocaleForm
          lang={lang}
          originalLocale={originalLocale}
          translate={translate}
          updateGlobalContentLocale={updateGlobalContentLocale}
          updateLocalContentLocale={updateLocalContentLocale}
        />
      );
    } else {
      content = (
        <CancelTranslationForm
          lang={lang}
          originalLocale={originalLocale}
          translate={translate}
          updateGlobalContentLocale={updateGlobalContentLocale}
          updateLocalContentLocale={updateLocalContentLocale}
        />
      );
    }

    return displayCustomModal(content);
  };

  render() {
    const { id, originalLocale, translate } = this.props;
    return (
      <div className="translate">
        <p>
          <Translate
            value={translate ? 'debate.thread.messageTranslatedFrom' : 'debate.thread.messageOriginallyIn'}
            language={I18n.t(`language.${originalLocale}`)}
          />
        </p>
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
    updateGlobalContentLocale: (value) => {
      return dispatch(setContentLocale(ownProps.originalLocale, value));
    }
  };
};

export default connect(null, mapDispatchToProps)(PostTranslate);