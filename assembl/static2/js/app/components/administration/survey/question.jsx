import React from 'react';
import { gql, graphql, withApollo } from 'react-apollo';
import { Link } from 'react-router';
import { Row, Col } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';
import SectionTitle from '../sectionTitle';
import VideoForm from './videoForm';
import { getDiscussionSlug } from '../../../utils/globalFunctions';

const GetThematics = gql`
{
  thematics(identifier:"survey") {
    id,
    titleEntries {
      localeCode,
      value
    }
  }
}
`;

const Question = ({ data, i18n }) => {
  if (data.loading) {
    return null;
  }
  const thematics = data.thematics || [];
  const slug = getDiscussionSlug();
  return (
    <div className="admin-box">
      <SectionTitle i18n={i18n} phase="survey" tabId="1" annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <Row>
          {thematics.map((thematic, index) => {
            return(
              <Col xs={12} md={Math.round(12 / thematics.length)} key={index}>
                <Link className="tab-title" activeClassName="tab-title-active" to={`/${slug}/administration/survey?section=2&thematic=${thematic.id}`}>
                  {`${I18n.t('administration.thematic')} ${index + 1}`}
                </Link>
              </Col>
            )
          })}
        </Row>
        <div className="form-container">
          <VideoForm />
        </div>
      </div>
    </div>
  );
};

export default withApollo(graphql(GetThematics)(Question));