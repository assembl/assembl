// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

import SwitchButton from '../../common/switchButton';
import { displayCustomModal } from '../../../utils/utilityManager';
import ChooseContentLocaleForm from './chooseContentLocaleForm';
import { setContentLocale } from '../../../actions/contentLocaleActions';

type PostTranslateProps = {
  id: string,
  originalBodyLocale: string,
  showOriginal: boolean,
  toggle: Function,
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

  openModal = () => {
    const { originalBodyLocale, updateGlobalContentLocale, updateLocalContentLocale } = this.props;
    const setIsTranslatedThen = (callback) => {
      return () => {
        this.setState(
          {
            isTranslated: true
          },
          callback
        );
      };
    };
    const content = (
      <ChooseContentLocaleForm
        originalLocale={originalBodyLocale}
        updateGlobalContentLocale={setIsTranslatedThen(updateGlobalContentLocale)}
        updateLocalContentLocale={setIsTranslatedThen(updateLocalContentLocale)}
      />
    );
    return displayCustomModal(content);
  };

  render() {
    const { id, originalBodyLocale, showOriginal, toggle } = this.props;
    return (
      <div className="translate">
        <p>
          <Translate
            value={!showOriginal ? 'debate.thread.messageTranslatedFrom' : 'debate.thread.messageOriginallyIn'}
            language={I18n.t(`language.${originalBodyLocale}`)}
          />
        </p>

        {this.state.isTranslated
          ? <SwitchButton
            name={`switch-${id}`}
            onChange={toggle}
            defaultChecked={showOriginal}
            labelRight={I18n.t('debate.thread.showOriginal')}
          />
          : <Button onClick={this.openModal}>
            <Translate value="debate.thread.translate" />
          </Button>}
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    updateGlobalContentLocale: (value) => {
      return dispatch(setContentLocale(ownProps.originalBodyLocale, value));
    }
  };
};

export default connect(null, mapDispatchToProps)(PostTranslate);