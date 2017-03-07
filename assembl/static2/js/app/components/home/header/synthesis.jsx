import React from 'react';
import { connect } from 'react-redux';
import { Translate, Localize } from 'react-redux-i18n';

class Synthesis extends React.Component {
  render() {
    const { synthesis } = this.props.synthesis;
    const { debateData } = this.props.debate;
    const { rootPath, connectedUserId } = this.props.context;
    return (
      <div className="synthesis-container">
        {(Object.keys(synthesis.lastPublishedSynthesis).length > 0 && synthesis.lastPublishedSynthesis.introduction) &&
          <a href={connectedUserId ? `/${debateData.slug}/posts/${synthesis.lastPublishedSynthesis.published_in_post}` : `${rootPath}${debateData.slug}/login`}>
            <div className="insert-box">
              <h3 className="dark-title-4 ellipsis">
                <div>
                  <Translate value="synthesis.title" />
                </div>
                <div className="ellipsis margin-xs">
                  {synthesis.lastPublishedSynthesis.subject}
                </div>
              </h3>
              <div className="box-hyphen">&nbsp;</div>
              <div className="date">
                <Localize value={synthesis.lastPublishedSynthesis.creation_date} dateFormat="date.format2" />
              </div>
              <div className="insert-content margin-s">
                {<p dangerouslySetInnerHTML={{ __html: synthesis.lastPublishedSynthesis.introduction }} />}
              </div>
            </div>
          </a>
        }
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    context: state.context,
    synthesis: state.synthesis
  };
};

export default connect(mapStateToProps)(Synthesis);