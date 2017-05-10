import React from 'react';
import { connect } from 'react-redux';
import { addAdminData } from '../../actions/adminActions';
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

class LanguageMenu extends React.Component {
  constructor(props) {
    super(props);
    this.changeLanguage = this.changeLanguage.bind(this);
  }
  changeLanguage(event) {
    const selectedLocale = event.currentTarget.getAttribute('id');
    this.props.addAdminData(selectedLocale);
  }
  render() {
    const { translations } = this.props.i18n;
    const { selectedLocale } = this.props.admin;
    return (
      <div className="relative">
        <div className="language-menu">
          {Object.keys(translations).map((key, index) => {
            return (
              <div
                onClick={this.changeLanguage}
                id={key}
                className={selectedLocale === key ? 'flag-container active' : 'flag-container'}
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

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n,
    admin: state.admin
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addAdminData: (selectedLocale) => {
      dispatch(addAdminData(selectedLocale));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(LanguageMenu);