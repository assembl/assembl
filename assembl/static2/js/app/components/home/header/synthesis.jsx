import React from 'react';
import { connect } from 'react-redux';
import { Translate, Localize } from 'react-redux-i18n';
import { getConnectedUserId, getDiscussionSlug } from '../../../utils/globalFunctions';
import { getCurrentView, get, getContextual } from '../../../utils/routeMap';

class Synthesis extends React.Component {
  render() {
    const { synthesis } = this.props.synthesis;
    const slug = { slug: getDiscussionSlug() };
    const connectedUserId = getConnectedUserId();
    const next = getCurrentView();
    return (
      <div className="synthesis-container">
        {(Object.keys(synthesis.lastPublishedSynthesis).length > 0 && synthesis.lastPublishedSynthesis.introduction) &&
          <a href={connectedUserId ? `${get('oldDebate', slug)}/posts/${synthesis.lastPublishedSynthesis.published_in_post}` : `${getContextual('login', slug)}?next=${next}`}>
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
    synthesis: state.synthesis
  };
};

export default connect(mapStateToProps)(Synthesis);