// @flow
import React from 'react';
import { Button, FormControl, FormGroup, Modal, Radio } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

import { closeModal } from '../../../../utils/utilityManager';

type Locale = {
  label: string,
  localeCode: string
};

type ChooseContentLocaleFormProps = {
  allLocales: Array<Locale>,
  originalLocale: string,
  originalLocaleLabel: string,
  updateById: (value: string) => void,
  updateByOriginalLocale: (value: string) => void
};

type Scope = 'local' | 'global' | null;

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
      scope: null,
      selectedLocale: 'select'
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
    const { updateById, updateByOriginalLocale } = this.props;
    const { scope, selectedLocale } = this.state;
    if (scope === 'local') {
      updateById(selectedLocale);
    } else if (scope === 'global') {
      updateByOriginalLocale(selectedLocale);
    }
    closeModal();
  };

  render() {
    const { allLocales, originalLocale, originalLocaleLabel } = this.props;
    const { scope, selectedLocale } = this.state;
    const translateAllLabel = I18n.t('debate.thread.translateAllMessagesIn', {
      language: originalLocaleLabel
    });
    const translateOneLabel = I18n.t('debate.thread.translateOnlyThisMessage');
    const availableLanguages = allLocales.filter(lang => lang.localeCode !== originalLocale);
    return (
      <div className="choose-content-locale-form">
        <Modal.Header closeButton />
        <Modal.Body>
          <FormGroup>
            <FormGroup>
              <Radio
                checked={scope === 'global'}
                title={translateAllLabel}
                value="global"
                onChange={() => this.updateScope('global')}
              >
                {translateAllLabel}
              </Radio>
            </FormGroup>
            <FormGroup>
              <Radio
                checked={scope === 'local'}
                title={translateOneLabel}
                value="local"
                onChange={() => this.updateScope('local')}
              >
                {translateOneLabel}
              </Radio>
            </FormGroup>
          </FormGroup>
          {scope ? (
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
                <option value="select">{I18n.t('debate.thread.chooseLanguagePh')}</option>
                {availableLanguages.map(lang => (
                  <option key={`locale-${lang.localeCode}`} value={lang.localeCode}>
                    {lang.label}
                  </option>
                ))}
              </FormControl>
            </FormGroup>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button key="translate-cancel" onClick={closeModal} className="button-cancel button-dark left">
            <Translate value="cancel" />
          </Button>
          <Button
            key="translate-submit"
            disabled={selectedLocale === 'select' || !scope}
            onClick={this.handleSubmit}
            className="button-submit button-dark right"
          >
            <Translate value="validate" />
          </Button>
        </Modal.Footer>
      </div>
    );
  }
}

export default ChooseContentLocaleForm;