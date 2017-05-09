import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, FormControl } from 'react-bootstrap';

class ThemeCreationForm extends React.Component {
  render() {
    const { index, selectedLocale } = this.props;
    const trsl = I18n.t('administration.ph.title');
    const ph = `${trsl} ${selectedLocale.toUpperCase()}`;
    return (
      <div className="form-container">
        <div className="title">
          <Translate value="administration.themeNum" index={index + 1} />
        </div>
        <FormGroup>
          <FormControl type="text" placeholder={ph} />
        </FormGroup>
        <FormGroup>
          <FormControl type="text" placeholder="Composant provisoire" />
        </FormGroup>
        <div className="pointer right">
          <span className="assembl-icon-delete grey" />
        </div>
        <div className="separator" />
      </div>
    );
  }
}

export default ThemeCreationForm;