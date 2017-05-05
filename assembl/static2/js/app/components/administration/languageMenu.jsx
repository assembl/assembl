import React from 'react';
import { connect } from 'react-redux';
import { getAvailableLocales } from '../../utils/globalFunctions';

class LanguageMenu extends React.Component {
  render() {
    const { translations } = this.props.i18n;
    return(
      <div>
        {Object.keys(translations).map((key, index) => {
          return (<span key={index}>{key.toUpperCase()}</span>);
        })}
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