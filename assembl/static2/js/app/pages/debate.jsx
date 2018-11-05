// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import Loader from '../components/common/loader';
import Themes from '../components/debate/common/themes';
import DebateThematicsQuery from '../graphql/DebateThematicsQuery.graphql';

type Props = {
  phaseId: string,
  identifier: string,
  data: {
    loading: boolean,
    error: ?Error,
    thematics: DebateThematicsQueryQuery
  },
  params: {
    phaseId?: string,
    themeId?: string,
    questionId?: string
  },
  children: React.Node
};

const Debate = ({ phaseId, identifier, data, params, children }: Props) => {
  const { loading, thematics } = data;
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

const DebateWithData = graphql(DebateThematicsQuery)(Debate);

const mapStateToProps = state => ({
  lang: state.i18n.locale
});

export default connect(mapStateToProps)(DebateWithData);