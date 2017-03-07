import React from 'react';
import { connect } from 'react-redux';
import { Translate, Localize } from 'react-redux-i18n';
import { Link } from 'react-router';

class Step extends React.Component {
  render() {
    const imgUrl = this.props.imgUrl;
    const startDate = this.props.startDate;
    const title = this.props.title;
    const text = this.props.text;
    const StepNumber = this.props.index + 1;
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    return (
      <div className="illustration-box">
        <div className="image-box" style={{ backgroundImage: `url(${imgUrl})` }}>&nbsp;</div>
        <Link className="content-box" to={`${rootPath}${debateData.slug}/home`}>
          <h1 className="light-title-1">{StepNumber}</h1>
          <h3 className="light-title-3">
            <Translate value={title} />
          </h3>
          <h4 className="light-title-4">
            <Localize value={startDate} dateFormat="date.format2" />
          </h4>
          <div className="text-box">
            <Translate value={text} />
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
    debate: state.debate,
    context: state.context
  };
};

export default connect(mapStateToProps)(Step);