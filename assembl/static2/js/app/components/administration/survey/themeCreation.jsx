import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';

import SectionTitle from '../sectionTitle';
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
      formList.push(<ThemeCreationForm index={index} selectedLocale={nextProps.admin.selectedLocale} translations={translations} key={index} />);
    });
    this.setState({
      formList: formList
    });
  }
  addThemeCreationForm() {
    const { selectedLocale } = this.props.admin;
    const { translations } = this.props.i18n;
    this.setState((prevState) => {
      return {
        formList: prevState.formList.concat(<ThemeCreationForm index={prevState.formList.length} selectedLocale={selectedLocale} translations={translations} key={prevState.formList.length} />)
      };
    });
  }
  render() {
    const { i18n, showSection } = this.props;
    return (
      <div className={showSection ? 'show admin-box' : 'hidden'}>
        <SectionTitle i18n={i18n} tabId="0" annotation={I18n.t('administration.annotation')} />
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
    admin: state.admin
  };
};

export default connect(mapStateToProps)(ThemeCreation);