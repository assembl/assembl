import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';
import ThemeCreationForm from './themeCreationForm';

class ThemeCreation extends React.Component {
  constructor(props) {
    super(props);
    const { selectedLocale } = this.props;
    const formComponent = <ThemeCreationForm index={0} selectedLocale={selectedLocale} key={0} />;
    this.state = {
      selectedLocale: selectedLocale,
      formList: [formComponent]
    }
    this.addThemeCreationForm = this.addThemeCreationForm.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    const formList = [];
    this.state.formList.forEach((form, index) => {
      formList.push(
        <ThemeCreationForm
          index={index}
          selectedLocale={nextProps.selectedLocale}
          key={index}
        />
      )
    });
    this.setState({
      selectedLocale: nextProps.selectedLocale,
      formList: formList
    });
  }
  addThemeCreationForm() {
    this.setState(prevState => ({
      formList: prevState.formList.concat(
        <ThemeCreationForm
          index={prevState.formList.length}
          selectedLocale={this.state.selectedLocale}
          key={prevState.formList.length}
        />
      )
    }));
  }
  render() {
    const { locale, translations } = this.props;
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
            {this.state.formList}
            <div onClick={this.addThemeCreationForm} className="plus margin-l">+</div>
            <Button className="button-submit button-dark margin-l">Suivant</Button>
          </form>
        </div>
      </div>
    );
  }
}

export default ThemeCreation;