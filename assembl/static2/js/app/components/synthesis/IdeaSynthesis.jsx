import React from 'react';
import { Tooltip } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';

import StatisticsDoughnut from '../debate/common/statisticsDoughnut';
import PostsAndContributorsCount from '../common/postsAndContributorsCount';
import { sentimentDefinitionsObject } from '../debate/common/sentimentDefinitions';
import { PublicationStates } from '../../constants';
import Section from '../common/section';
import { getTree, getChildren } from '../../utils/tree';

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
    <div className="synthesis-image-stats-container" style={{ backgroundImage: `url(${imgUrl})` }}>
      <SynthesisStats numContributors={numContributors} numPosts={numPosts} ideaLink={ideaLink} posts={posts} />
    </div>
  );
};

const IdeaSynthesis = (props) => {
  const { imgUrl, synthesisTitle, numContributors, numPosts, id, posts, phaseIdentifier, slug } = props;
  return (
    <div className="idea-synthesis">
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

const IdeaSynthesisTree = (props) => {
  const { title, slug, subIdeas, index, parents } = props;
  const { roots, children } = getTree(subIdeas);
  const newParents = parents.slice();
  newParents.push(index);
  return (
    <Section displayIndex title={title} index={index} parents={parents}>
      <IdeaSynthesis {...props} />
      {roots.map((rootIdea, subIndex) => {
        return (
          <IdeaSynthesisTree
            key={rootIdea.id}
            {...rootIdea}
            index={subIndex + 1}
            parents={newParents}
            subIdeas={getChildren(rootIdea, children)}
            slug={slug}
          />
        );
      })}
    </Section>
  );
};

export default IdeaSynthesisTree;