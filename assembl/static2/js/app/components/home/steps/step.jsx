import React from 'react';
import { connect } from 'react-redux';
import { Translate, Localize } from 'react-redux-i18n';
import { Link } from 'react-router';

class Step extends React.Component {
  render() {
    const imgUrl = this.props.imgUrl;
    const startDate = this.props.startDate;
    const title = this.props.title;
    const description = this.props.description;
    const StepNumber = this.props.index + 1;
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    const { locale } = this.props.i18n;
    return (
      <div className="illustration-box">
        <div className="image-box" style={{ backgroundImage: `url(${imgUrl})` }}>&nbsp;</div>
        <Link className="content-box" to={`${rootPath}${debateData.slug}/home`}>
          <h1 className="light-title-1">{StepNumber}</h1>
          <h3 className="light-title-3">
            {title.entries.map((title, index) => {
              return (
                <span key={`title-${index}`}>{locale === title['@language'] ? title.value : ''}</span>
              )
            })}
          </h3>
          <h4 className="light-title-4">
            <Localize value={startDate} dateFormat="date.format2" />
          </h4>
          <div className="text-box">
            {description.entries.map((description, index) => {
              return (
                <span key={`title-${index}`}>{locale === title['@language'] ? description.value : ''}</span>
              )
            })}
          </div>
        </Link>
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen">&nbsp;</div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n,
    debate: state.debate,
    context: state.context
  };
};

export default connect(mapStateToProps)(Step);