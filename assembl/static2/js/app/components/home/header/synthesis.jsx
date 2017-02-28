import React from 'react';
import { connect } from 'react-redux';
import { Translate, Localize } from 'react-redux-i18n';
import MapStateToProps from '../../../store/mapStateToProps';
import GlobalFunctions from '../../../utils/globalFunctions';

class Synthesis extends React.Component {
  render() {
    const { synthesis } = this.props.synthesis;
    return (
      <div className="synthesis-container">
        {(Object.keys(synthesis.lastPublishedSynthesis).length > 0 && synthesis.lastPublishedSynthesis.introduction) &&
          <div className="insert-box">
            <h3 className="dark-title-3 ellipsis">
              <div>
                <Translate value="synthesis.title" />
              </div>
              <div className="ellipsis margin-xs">
                {synthesis.lastPublishedSynthesis.subject}
              </div>
            </h3>
            <div className="box-hyphen">&nbsp;</div>
            <div className="date">
              <Localize value={synthesis.lastPublishedSynthesis.creation_date} dateFormat="date.format" />
            </div>
            <div className="insert-content margin-s">
              {GlobalFunctions.parseHtml(synthesis.lastPublishedSynthesis.introduction)}
            </div>
          </div>
        }
      </div>
    );
  }
}

export default connect(MapStateToProps)(Synthesis);