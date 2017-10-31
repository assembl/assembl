import React from 'react';
import { Image } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';

import StatisticsDoughnut from '../debate/common/statisticsDoughnut';
import PostsAndContributorsCount from '../common/postsAndContributorsCount';

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
  return (
    <p className="synthesis-body">
      {value}
    </p>
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

const SynthesisStats = ({ numContributors, numPosts, ideaLink }) => {
  return (
    <div className="synthesis-stats">
      <StatisticsDoughnut elements={[]} placement="after" />
      <PostsAndContributorsCount vertical numContributors={numContributors} numPosts={numPosts} />
      <LinkToIdea href={ideaLink} />
    </div>
  );
};

const ImageWithSynthesisStats = ({ imageSrc, numContributors, numPosts, ideaLink }) => {
  return (
    <div className="synthesis-image-stats-container">
      <Image className="synthesis-image" responsive src={imageSrc} />
      <SynthesisStats numContributors={numContributors} numPosts={numPosts} ideaLink={ideaLink} />
    </div>
  );
};

export default ({ title, imageSrc, body, numContributors, numPosts, ideaLink }) => {
  return (
    <div className="idea-synthesis">
      <TitleUnderHyphen value={title} />
      <ImageWithSynthesisStats imageSrc={imageSrc} numContributors={numContributors} numPosts={numPosts} ideaLink={ideaLink} />
      <SynthesisBody value={body} />
    </div>
  );
};