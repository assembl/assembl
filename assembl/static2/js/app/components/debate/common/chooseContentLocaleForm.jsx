// @flow
import React from 'react';
import { Button, FormControl, FormGroup, Modal, Radio } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

import { closeModal } from '../../../utils/utilityManager';

type ChooseContentLocaleFormProps = {
  originalLocale: string,
  updateGlobalContentLocale: Function,
  updateLocalContentLocale: Function
};

type Scope = 'local' | 'global';

type ChooseContentLocaleFormState = {
  scope: Scope,
  selectedLocale: string
};

class ChooseContentLocaleForm extends React.Component<*, ChooseContentLocaleFormProps, ChooseContentLocaleFormState> {
  props: ChooseContentLocaleFormProps;
  state: ChooseContentLocaleFormState;

  constructor() {
    super();
    this.state = {
      scope: 'local',
      selectedLocale: ''
    };
  }

  updateSelectedLocale = (selectedLocale: string): void => {
    this.setState({
      selectedLocale: selectedLocale
    });
  };

  updateScope = (scope: Scope): void => {
    this.setState({
      scope: scope
    });
  };

  handleSubmit = () => {
    const { updateGlobalContentLocale, updateLocalContentLocale } = this.props;
    const { scope, selectedLocale } = this.state;
    if (scope === 'local') {
      updateLocalContentLocale(selectedLocale);
    } else if (scope === 'global') {
      updateGlobalContentLocale(selectedLocale);
    }
    closeModal();
  };

  render() {
    const { originalLocale } = this.props;
    const { scope, selectedLocale } = this.state;
    const translateAllLabel = I18n.t('debate.thread.translateAllMessagesIn', {
      language: I18n.t(`language.${originalLocale}`)
    });
    const translateOneLabel = I18n.t('debate.thread.translateOnlyThisMessage');
    const availableLanguages = [
      { name: 'Allemand', locale: 'de' },
      { name: 'Anglais', locale: 'en' },
      { name: 'Français', locale: 'fr' }
    ].filter((lang) => {
      return lang.locale !== originalLocale;
    });
    return (
      <div>
        <Modal.Header closeButton />
        <Modal.Body>
          <FormGroup>
            <Radio
              checked={scope === 'global'}
              title={translateAllLabel}
              value="global"
              onClick={() => {
                return this.updateScope('global');
              }}
            >
              {translateAllLabel}
            </Radio>
            <Radio
              checked={scope === 'local'}
              title={translateOneLabel}
              value="local"
              onClick={() => {
                return this.updateScope('local');
              }}
            >
              {translateOneLabel}
            </Radio>
          </FormGroup>
          <FormGroup>
            <FormControl
              componentClass="select"
              placeholder="select"
              onChange={(e) => {
                if (e.target.value !== 'select') {
                  this.updateSelectedLocale(e.target.value);
                }
              }}
              value={selectedLocale}
            >
              <option value="select">
                <Translate value="debate.thread.chooseLanguagePh" />
              </option>
              {availableLanguages.map((lang) => {
                return (
                  <option value={lang.locale}>
                    {lang.name}
                  </option>
                );
              })}
            </FormControl>
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

export default ChooseContentLocaleForm;