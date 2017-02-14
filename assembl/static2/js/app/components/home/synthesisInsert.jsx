import React from 'react';
import { connect } from 'react-redux';
import { Translate, Localize } from 'react-redux-i18n';
import MapStateToProps from '../../store/mapStateToProps';

class SynthesisInsert extends React.Component {
  render() {
    const { synthesis } = this.props.synthesis;
    console.log()
    return (
      <div className="insert-box">
        <h3 className="dark-title-3 ellipsis">
          <div>
            <Translate value="synthesis.title" />
          </div>
          <div className="margin-xs">
            {synthesis.lastPublishedSynthesis.subject}
          </div>
        </h3>
        <div className="hyphen">&nbsp;</div>
        <div className="date">
          <Localize value={synthesis.lastPublishedSynthesis.creation_date} dateFormat="date.format"/>
        </div>
        <div className="ellipsis-content margin-s">
          {synthesis.lastPublishedSynthesis.introduction}
        </div>
      </div>
    );
  }
}

export default connect(MapStateToProps)(SynthesisInsert);