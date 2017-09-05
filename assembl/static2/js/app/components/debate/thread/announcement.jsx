import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import Doughnut from '../../svg/doughnut';

class Announcement extends React.Component {
  render = () => {
    console.log('ann prop', this.props.ideaWithPostsData);
    const { idea } = this.props.ideaWithPostsData;
    const { numContributors, numPosts } = idea;
    return (
      <div style={{ textAlign: 'center' }}>
        <h3>
          <Translate value="debate.thread.announcement" />
        </h3>
        <Doughnut
          elements={[
            { name: 'orange', count: 2 },
            { name: 'purple', count: 5 },
            { name: 'green', count: 6 },
            { name: 'red', count: 6 }
          ]}
          text={`168 ${I18n.t('debate.survey.reactions')}`}
        />
        <section>
          {numPosts} <span className="assembl-icon-message" /> - {numContributors} <span className="assembl-icon-profil" />
        </section>
      </div>
    );
  };
}

export default Announcement;