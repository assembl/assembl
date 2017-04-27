import React from 'react';
import { connect } from 'react-redux';
import { Localize } from 'react-redux-i18n';
import { Link } from 'react-router';
import Routes from '../../../utils/routeMap';
import { getDiscussionSlug } from '../../../utils/globalFunctions';

class Step extends React.Component {
  render() {
    const slug = { slug: getDiscussionSlug() };
    const { locale } = this.props.i18n;
    const { imgUrl, startDate, title, description, index, identifier } = this.props;
    const stepNumber = index + 1;
    return (
      <div className="illustration-box">
        <div className="image-box" style={{ backgroundImage: `url(${imgUrl})` }}>&nbsp;</div>
        <Link className="content-box" to={`${Routes.get('debate', slug)}?phase=${identifier}`}>
          <h1 className="light-title-1">{stepNumber}</h1>
          {title &&
            <h3 className="light-title-3">
              {title.entries.map((entry, index2) => {
                return (
                  <span key={index2}>{locale === entry['@language'] ? entry.value : ''}</span>
                );
              })}
            </h3>
          }
          <h4 className="light-title-4">
            <Localize value={startDate} dateFormat="date.format2" />
          </h4>
          {description &&
            <div className="text-box">
              {description.entries.map((entry, index3) => {
                return (
                  <span key={index3}>{locale === entry['@language'] ? entry.value : ''}</span>
                );
              })}
            </div>
          }
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
    debate: state.debate
  };
};

export default connect(mapStateToProps)(Step);