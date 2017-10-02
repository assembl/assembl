// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';

import { updateContentLocaleById, updateContentLocaleByOriginalLocale } from '../../../actions/contentLocaleActions';
import SwitchButton from '../../common/switchButton';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { displayCustomModal } from '../../../utils/utilityManager';
import CancelTranslationForm from './cancelTranslationForm';
import ChooseContentLocaleForm from './chooseContentLocaleForm';

type PostTranslateProps = {
  contentLocale: string,
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

  constructor() {
    super();
    this.state = {
      isTranslated: false
    };
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
    const { id, lang, originalLocale, translate, updateById, updateByOriginalLocale } = this.props;
    let content;
    if (!translate) {
      content = (
        <ChooseContentLocaleForm
          id={id}
          lang={lang}
          originalLocale={originalLocale}
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
          translate={translate}
          updateById={updateById}
          updateByOriginalLocale={updateByOriginalLocale}
        />
      );
    }

    return displayCustomModal(content);
  };

  render() {
    const { id, lang, originalLocale, translate } = this.props;
    const specialLocaleCodes = ['und', 'zxx']; // locale codes that can not be translated
    const showPostTranslate = originalLocale !== lang && specialLocaleCodes.indexOf(originalLocale) === -1;
    if (!showPostTranslate) {
      return null;
    }
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
    updateById: (value) => {
      return dispatch(updateContentLocaleById(ownProps.id, value));
    },
    updateByOriginalLocale: (value) => {
      return dispatch(updateContentLocaleByOriginalLocale(ownProps.originalLocale, value));
    }
  };
};

export default connect(null, mapDispatchToProps)(PostTranslate);