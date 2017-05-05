import React from 'react';
import { connect } from 'react-redux';
import { getAvailableLocales } from '../../utils/globalFunctions';

class LanguageMenu extends React.Component {
  render() {
    const { translations } = this.props.i18n;
    return(
      <div className="relative right">
        <div className="language-menu">
          {Object.keys(translations).map((key, index) => {
            return (<div key={index}>{key.toUpperCase()}</div>);
          })}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n
  }
}

export default connect(mapStateToProps)(LanguageMenu);