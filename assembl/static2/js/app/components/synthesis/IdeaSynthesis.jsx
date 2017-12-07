// @flow

import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';

import StatisticsDoughnut from '../debate/common/statisticsDoughnut';
import PostsAndContributorsCount from '../common/postsAndContributorsCount';
import { getSentimentsCount, createDoughnutElements } from '../debate/common/announcement';

export type SynthesisIdea = {
  id: string,
  ancestors: Array<string>,
  title: string,
  synthesisTitle: string,
  live: {
    id: string,
    order: number,
    img: {
      externalUrl: string
    },
    numContributors: number,
    numPosts: number,
    posts: {
      edges: Array<Object>
    }
  }
};

const SynthesisBody = ({ level, hasSiblings, value, stats }) => (
  <div className="synthesis-body" style={{ columnCount: !hasSiblings && level > 2 ? 2 : 'auto' }}>
    <p dangerouslySetInnerHTML={{ __html: value }} />
    {stats}
  </div>
);

const LinkToIdea = ({ href }) => (
  <Link className="idea-link" to={href}>
    {'> '}
    <Translate value="synthesis.seeConversation" />
  </Link>
);

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

const SynthesisImage = ({ level, imgUrl, stats }) => {
  if (level === 1) {
    return (
      <div className="synthesis-image-container" style={imgUrl && { backgroundImage: `url(${imgUrl})` }}>
        {stats}
      </div>
    );
  }
  if (level === 2) {
    return (
      <div>
        <div className="image-container">
          <div className="synthesis-image-container" style={imgUrl && { backgroundImage: `url(${imgUrl})` }} />
        </div>
        {stats}
      </div>
    );
  }
  return null;
};

const IdeaSynthesis = (props: { idea: SynthesisIdea, hasSiblings: boolean, level: number, slug: string }) => {
  const { idea, hasSiblings, level, slug } = props;
  const { id, img, numContributors, numPosts, posts } = idea.live;
  const phaseIdentifier = 'thread'; // TODO: Proper phase identification
  // For now, syntheses can only have ideas from the "thread" phase.

  const imgUrl = img && img.externalUrl;
  const link = `/${slug}/debate/${phaseIdentifier}/theme/${id}`;
  const stats = <SynthesisStats numContributors={numContributors} numPosts={numPosts} ideaLink={link} posts={posts} />;
  return (
    <div className={`${'idea-synthesis idea-synthesis-level-'}${level}`}>
      <SynthesisImage level={level} imgUrl={imgUrl} stats={stats} />
      <SynthesisBody value={idea.synthesisTitle} hasSiblings={hasSiblings} level={level} stats={level >= 3 ? stats : null} />
    </div>
  );
};

export default IdeaSynthesis;