import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, FormControl } from 'react-bootstrap';

class ThemeCreationForm extends React.Component {
  constructor(props) {
    super(props);
    // TO DO get it from the API + get available locales
    const obj = {
      title: {
        fr: '',
        en: ''
      }
    };
    this.state = obj;
    this.getTitleValue = this.getTitleValue.bind(this);
  }
  getTitleValue(event) {
    const { selectedLocale } = this.props;
    const val = event.target.value;
    const obj = this.state.title;
    obj[selectedLocale] = val;
    this.setState(obj);
  }
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
          <FormControl
            type="text"
            placeholder={ph}
            value={this.state.title[selectedLocale]}
            onChange={this.getTitleValue}
          />
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