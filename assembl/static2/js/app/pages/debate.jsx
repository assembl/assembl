import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import Loader from '../components/common/loader';
import Themes from '../components/debate/common/themes';
import DebateThematicsQuery from '../graphql/DebateThematicsQuery.graphql';

const Debate = ({ identifier, data, params, children }) => {
  const { loading, thematics } = data;
  const phaseId = params.phaseId || null;
  const themeId = params.themeId || null;
  const questionId = params.questionId || null;
  const isParentRoute = !(themeId || questionId) || false;
  const childrenElm = React.Children.map(children, child =>
    React.cloneElement(child, {
      id: themeId || questionId,
      identifier: identifier,
      phaseId: phaseId
    })
  );
  return (
    <div className="debate">
      {loading && isParentRoute && <Loader color="black" />}
      <div>
        {thematics && isParentRoute && <Themes thematics={thematics} identifier={identifier} phaseId={phaseId} />}
        {thematics && !isParentRoute && <section className="debate-section">{childrenElm}</section>}
      </div>
    </div>
  );
};

Debate.propTypes = {
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    thematics: PropTypes.Array
  }).isRequired
};

const DebateWithData = graphql(DebateThematicsQuery)(Debate);

const mapStateToProps = state => ({
  lang: state.i18n.locale
});

export default connect(mapStateToProps)(DebateWithData);