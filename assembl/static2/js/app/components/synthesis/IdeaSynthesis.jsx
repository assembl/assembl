import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';

import StatisticsDoughnut from '../debate/common/statisticsDoughnut';
import PostsAndContributorsCount from '../common/postsAndContributorsCount';
import { getSentimentsCount, createDoughnutElements } from '../debate/common/announcement';

const SynthesisBody = ({ level, value, stats }) => {
  return (
    <div className="synthesis-body" style={{ columnCount: level > 2 ? 2 : 'auto' }}>
      <p dangerouslySetInnerHTML={{ __html: value }} />
      {stats}
    </div>
  );
};

const LinkToIdea = ({ href }) => {
  return (
    <Link className="idea-link" to={href}>
      {'> '}
      <Translate value="synthesis.seeConversation" />
    </Link>
  );
};

const SynthesisStats = ({ numContributors, numPosts, ideaLink, posts }) => {
  const sentimentCounts = getSentimentsCount(posts);
  const doughnutElements = createDoughnutElements(sentimentCounts);
  return (
    <div className="synthesis-stats">
      <StatisticsDoughnut elements={doughnutElements} placement="after" />
      <PostsAndContributorsCount vertical numContributors={numContributors} numPosts={numPosts} />
      <LinkToIdea href={ideaLink} />
    </div>
  );
};

const SynthesisImage = ({ level, title, imgUrl, stats }) => {
  if (level === 1) {
    return (
      <div className="synthesis-image-container" style={{ backgroundImage: `url(${imgUrl})` }}>
        {stats}
      </div>
    );
  }
  if (level === 2) {
    return (
      <div>
        <img alt={title} className="synthesis-image-container" src={imgUrl} />
        {stats}
      </div>
    );
  }
  return null;
};

const IdeaSynthesis = (props) => {
  const { idea, level, slug } = props;
  const { id, title, img, synthesisTitle, numContributors, numPosts, posts } = idea;
  const phaseIdentifier = 'thread'; // TODO: Proper phase identification
  // For now, syntheses can only have ideas from the "thread" phase.
  const imgUrl = img && img.externalUrl;
  const link = `/${slug}/debate/${phaseIdentifier}/theme/${id}`;
  const stats = <SynthesisStats numContributors={numContributors} numPosts={numPosts} ideaLink={link} posts={posts} />;
  return (
    <div className={`${'idea-synthesis idea-synthesis-level-'}${level}`}>
      <SynthesisImage level={level} title={title} imgUrl={imgUrl} stats={stats} />
      <SynthesisBody value={synthesisTitle} level={level} stats={level >= 3 ? stats : null} />
    </div>
  );
};

export default IdeaSynthesis;