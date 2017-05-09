import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import Menu from '../components/administration/menu';
import LanguageMenu from '../components/administration/languageMenu';

class Administration extends React.Component {
  constructor(props) {
    super(props);
    const { locale } = this.props.i18n;
    this.state = {
      selectedLocale: locale
    };
    this.changeLanguage = this.changeLanguage.bind(this);
  }
  changeLanguage(sLocale) {
    this.setState({
      selectedLocale: sLocale
    });
  }
  render() {
    const { locale, translations } = this.props.i18n;
    const { phase } = this.props.params;
    const that = this;
    const children = React.Children.map(this.props.children, (child) => {
      return React.cloneElement(child, {
        locale: locale,
        translations: translations,
        selectedLocale: that.state.selectedLocale
      });
    });
    return (
      <div className="administration">
        <div className="max-container">
          <Grid fluid>
            <Row>
              <Col xs={12} md={3}>
                <div className="admin-menu-container">
                  <Menu requestedPhase={phase} />
                </div>
              </Col>
              <Col xs={12} md={8}>{children}</Col>
              <Col xs={12} md={1}>
                <LanguageMenu selectedLocale={this.state.selectedLocale} translations={translations} changeLanguage={this.changeLanguage} />
              </Col>
            </Row>
          </Grid>
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

export default connect(mapStateToProps)(Administration);