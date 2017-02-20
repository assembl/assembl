import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';

class Step extends React.Component {
  render() {
    const imgUrl = this.props.imgUrl;
    const title = this.props.title;
    const text = this.props.text;
    const StepNumber = this.props.stepNumber;
    
    return (
      <div className="illustration-box">
        <div className="image-box" style={{ backgroundImage: `url(${imgUrl})` }}>&nbsp;</div>
        <Link className="content-box">
          <h1 className="light-title-1">{StepNumber}</h1>
          <h3 className="light-title-3">
            <Translate value={title} />
          </h3>
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

export default Step;