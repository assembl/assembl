import React from 'react';
import En from '../svg/flags/en';
import Fr from '../svg/flags/fr';

// TO DO get it dynamically
const Flag = (key) => {
  switch (key) {
  case 'en':
    return <En />;
  case 'fr':
    return <Fr />;
  default:
    return <Fr />;
  }
};

//TO DO Put the selectedLocale in the store

class LanguageMenu extends React.Component {
  constructor(props) {
    super(props);
    const { selectedLocale } = this.props;
    this.state = {
      selectedLocale: selectedLocale
    };
    this.changeLanguage = this.changeLanguage.bind(this);
  }
  changeLanguage(event) {
    const selectedLocale = event.currentTarget.getAttribute('id');
    this.setState({
      selectedLocale: selectedLocale
    });
    this.props.changeLanguage(selectedLocale);
  }
  render() {
    const { translations } = this.props;
    return (
      <div className="relative">
        <div className="language-menu">
          {Object.keys(translations).map((key, index) => {
            return (
              <div
                onClick={this.changeLanguage}
                id={key}
                className={this.state.selectedLocale === key ? 'flag-container active' : 'flag-container'}
                key={index}
              >
                {Flag(key)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default LanguageMenu;