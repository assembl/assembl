// @flow
import React from 'react';
import { Button, FormGroup, Modal, Radio } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

import { closeModal } from '../../../utils/utilityManager';

type CancelTranslationFormProps = {
  originalLocale: string,
  updateById: (value: string) => void,
  updateByOriginalLocale: (value: string) => void
};

type Scope = 'local' | 'global';

type CancelTranslationFormState = {
  scope: Scope
};

class CancelTranslationForm extends React.Component<*, CancelTranslationFormProps, CancelTranslationFormState> {
  props: CancelTranslationFormProps;
  state: CancelTranslationFormState;

  constructor() {
    super();
    this.state = {
      scope: 'local'
    };
  }

  updateScope = (scope: Scope): void => {
    this.setState({
      scope: scope
    });
  };

  handleSubmit = () => {
    const { originalLocale, updateById, updateByOriginalLocale } = this.props;
    const { scope } = this.state;
    if (scope === 'local') {
      updateById(originalLocale);
    } else if (scope === 'global') {
      updateByOriginalLocale(originalLocale);
    }
    closeModal();
  };

  render() {
    const { originalLocale } = this.props;
    const { scope } = this.state;
    const untranslateAllLabel = I18n.t('debate.thread.untranslateAllMessagesIn', {
      language: I18n.t(`language.${originalLocale}`)
    });
    const untranslateOneLabel = I18n.t('debate.thread.untranslateOnlyThisMessage');

    return (
      <div className="choose-content-locale-form">
        <Modal.Header closeButton />
        <Modal.Body>
          <FormGroup>
            <Radio
              checked={scope === 'global'}
              title={untranslateAllLabel}
              value="global"
              onChange={() => {
                return this.updateScope('global');
              }}
            >
              {untranslateAllLabel}
            </Radio>
            <Radio
              checked={scope === 'local'}
              title={untranslateOneLabel}
              value="local"
              onChange={() => {
                return this.updateScope('local');
              }}
            >
              {untranslateOneLabel}
            </Radio>
          </FormGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button key="translate-cancel" onClick={closeModal} className="button-cancel button-dark">
            <Translate value="debate.thread.translateCancel" />
          </Button>,
          <Button key="translate-submit" onClick={this.handleSubmit} className="button-submit button-dark">
            <Translate value="debate.thread.translateSubmit" />
          </Button>
        </Modal.Footer>
      </div>
    );
  }
}

export default CancelTranslationForm;