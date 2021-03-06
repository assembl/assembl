// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Grid, Row, Col } from 'react-bootstrap';
import classNames from 'classnames';

import { get } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { getCurrentPhaseData } from '../../utils/timeline';
import { browserHistory } from '../../router';
import ParticipateButton from '../common/participateButton';
import manageErrorAndLoading from '../common/manageErrorAndLoading';
import DiscussionQuery from '../../graphql/DiscussionQuery.graphql';

type Props = {
  debate: DebateData,
  timeline: Timeline,
  lang: string,
  buttonLabel?: ?string
};

const Objectives = ({ debate, timeline, lang, buttonLabel }: Props) => {
  const displayPhase = () => {
    const slug = { slug: getDiscussionSlug() };
    const { currentPhaseIdentifier } = getCurrentPhaseData(timeline);
    browserHistory.push(get('debate', { ...slug, phase: currentPhaseIdentifier }));
  };

  const { debateData: { objectives } } = debate;
  let locale = lang;
  if (locale === 'zh-CN') {
    locale = 'zh_CN';
  }

  const haveOneImage = objectives.images.img1Url !== '' || objectives.images.img2Url !== '';
  const haveTwoImages = objectives.images.img1Url !== '' && objectives.images.img2Url !== '';

  return (
    <section className="home-section objectives-section-1">
      <Grid fluid>
        <div className="max-container">
          <div className="title-section">
            <div className="title-hyphen">&nbsp;</div>
            <h1 className="dark-title-1">{objectives.titleEntries[locale]}</h1>
          </div>
          <div className="content-section">
            <div className="content-margin">
              <Row className={classNames({ 'center-content': !haveOneImage })}>
                <Col xs={12} sm={12} md={haveTwoImages ? 6 : 9} className="objectives">
                  <div className={haveOneImage ? 'text-column-2' : 'text-column-3'}>
                    <span>{objectives.descriptionEntries[locale]}</span>
                  </div>
                </Col>
                {haveOneImage && (
                  <Col xs={12} sm={12} md={haveTwoImages ? 6 : 3} className="container-objectives-img objectives">
                    {objectives.images.img1Url && (
                      <div
                        className={classNames('objectives-img', haveTwoImages ? 'margin-right size-two-img' : 'size-single-img')}
                        style={{ backgroundImage: `url(${objectives.images.img1Url})` }}
                      />
                    )}
                    {objectives.images.img2Url && (
                      <div
                        className={classNames('objectives-img', 'size-two-img')}
                        style={{ backgroundImage: `url(${objectives.images.img2Url})` }}
                      />
                    )}
                  </Col>
                )}
              </Row>
            </div>
            <div className="center inline full-size margin-xxl">
              <ParticipateButton btnLabel={buttonLabel} displayPhase={displayPhase} timeline={timeline} btnClass="dark" />
            </div>
          </div>
        </div>
      </Grid>
    </section>
  );
};

Objectives.defaultProps = {
  buttonLabel: null
};

const mapStateToProps = state => ({
  debate: state.debate,
  lang: state.i18n.locale,
  timeline: state.timeline
});

export default compose(
  connect(mapStateToProps),
  graphql(DiscussionQuery, {
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }

      return {
        error: data.error,
        loading: data.loading,
        buttonLabel: data.discussion.buttonLabel
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: false })
)(Objectives);