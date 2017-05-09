import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Button, FormGroup, FormControl } from 'react-bootstrap';

class ThemeCreation extends React.Component {
  render() {
    const { locale, translations } = this.props.i18n;
    return (
      <div className="admin-box">
        <h3 className="dark-title-3">
          {translations[locale].administration.survey[0]}
        </h3>
        <div className="box-hyphen" />
        <div className="annotation">
          <Translate value="administration.annotation" />
        </div>
        <div className="admin-content">
          <form>
            <FormGroup>
              <FormControl type="text" placeholder="Enter text" />
            </FormGroup>
            <FormGroup className="margin-l">
              <FormControl type="file" />
            </FormGroup>
            <div className="plus margin-l">+</div>
            <Button className="button-submit button-dark margin-l">Suivant</Button>
          </form>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(ThemeCreation);