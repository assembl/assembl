import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';
import ThemeCreationForm from './themeCreationForm';

class ThemeCreation extends React.Component {
  constructor(props) {
    super(props);
    const { selectedLocale } = this.props.admin;
    const { translations } = this.props.i18n;
    const formComponent = <ThemeCreationForm index={0} selectedLocale={selectedLocale} translations={translations} key={0} />;
    this.state = {
      formList: [formComponent]
    };
    this.addThemeCreationForm = this.addThemeCreationForm.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    const { translations } = this.props.i18n;
    const formList = [];
    this.state.formList.forEach((form, index) => {
      formList.push(
        <ThemeCreationForm
          index={index}
          selectedLocale={nextProps.admin.selectedLocale}
          translations={translations}
          key={index}
        />
      );
    });
    this.setState({
      formList: formList
    });
  }
  addThemeCreationForm() {
    const { selectedLocale } = this.props.admin;
    const { translations } = this.props.i18n;
    this.setState(prevState => ({
      formList: prevState.formList.concat(
        <ThemeCreationForm
          index={prevState.formList.length}
          selectedLocale={selectedLocale}
          translations={translations}
          key={prevState.formList.length}
        />
      )
    }));
  }
  render() {
    const { locale, translations } = this.props.i18n;
    const { showSection } = this.props;
    return (
      <div className={showSection ? 'show admin-box' : 'hidden'}>
        <h3 className="dark-title-3">
          {translations[locale].administration.survey[0]}
        </h3>
        <div className="box-hyphen" />
        <div className="annotation">
          <Translate value="administration.annotation" />
        </div>
        <div className="admin-content">
          <form>
            {this.state.formList}
            <div onClick={this.addThemeCreationForm} className="plus margin-l">+</div>
            <Button className="button-submit button-dark margin-l">Suivant</Button>
          </form>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    admin: state.admin,
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(ThemeCreation);