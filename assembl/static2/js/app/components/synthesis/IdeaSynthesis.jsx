import React from 'react';
import { Image, Tooltip } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';

import StatisticsDoughnut from '../debate/common/statisticsDoughnut';
import PostsAndContributorsCount from '../common/postsAndContributorsCount';
import { sentimentDefinitionsObject } from '../debate/common/sentimentDefinitions';
import { PublicationStates } from '../../constants';

const createTooltip = (sentiment, count) => {
  return (
    <Tooltip id={`${sentiment.camelType}Tooltip`} className="no-arrow-tooltip">
      {count} <Translate value={`debate.${sentiment.camelType}`} />
    </Tooltip>
  );
};

const getSentimentsCount = (posts) => {
  const counters = { ...sentimentDefinitionsObject };
  Object.keys(counters).forEach((key) => {
    counters[key].count = 0;
  });
  posts.edges.forEach(({ node: { sentimentCounts, publicationState } }) => {
    if (publicationState === PublicationStates.PUBLISHED) {
      Object.keys(counters).forEach((key) => {
        counters[key].count += sentimentCounts[key];
      });
    }
  });
  return counters;
};

const createDoughnutElements = (sentimentCounts) => {
  return Object.keys(sentimentCounts).map((key) => {
    return {
      color: sentimentCounts[key].color,
      count: sentimentCounts[key].count,
      Tooltip: createTooltip(sentimentCounts[key], sentimentCounts[key].count)
    };
  });
};

const TitleUnderHyphen = ({ value }) => {
  return (
    <div className="title-under-hyphen-container">
      <div className="title-hyphen">&nbsp;</div>
      <h3 className="title-under-hyphen-text">
        {value}
      </h3>
    </div>
  );
};

const SynthesisBody = ({ value }) => {
  return <p className="synthesis-body" dangerouslySetInnerHTML={{ __html: value }} />;
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

const ImageWithSynthesisStats = ({ imgUrl, numContributors, numPosts, ideaLink, posts }) => {
  return (
    <div className="synthesis-image-stats-container">
      <Image className="synthesis-image" responsive src={imgUrl} />
      <SynthesisStats numContributors={numContributors} numPosts={numPosts} ideaLink={ideaLink} posts={posts} />
    </div>
  );
};

export default (props) => {
  const { title, imgUrl, synthesisTitle, numContributors, numPosts, id, posts, phaseIdentifier, slug } = props;
  return (
    <div className="idea-synthesis">
      <TitleUnderHyphen value={title} />
      <ImageWithSynthesisStats
        imgUrl={imgUrl}
        numContributors={numContributors}
        numPosts={numPosts}
        ideaLink={`/${slug}/debate/${phaseIdentifier}/theme/${id}`}
        posts={posts}
      />
      <SynthesisBody value={synthesisTitle} />
    </div>
  );
};