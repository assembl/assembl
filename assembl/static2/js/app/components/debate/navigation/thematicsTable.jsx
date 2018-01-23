import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import DebateThematicsQuery from '../../../graphql/DebateThematicsQuery.graphql';
import ThematicTableItem from './thematicTableItem';

class ThematicsTable extends React.Component {
  render() {
    const { identifier, data } = this.props;
    const { thematics } = data;
    return (
      <div className="thematics-table">
        {thematics &&
          thematics.map(thematic => <ThematicTableItem key={thematic.id} identifier={identifier} thematic={thematic} />)}
      </div>
    );
  }
}

ThematicsTable.propTypes = {
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    thematics: PropTypes.Array
  }).isRequired
};

const DebateWithData = graphql(DebateThematicsQuery)(ThematicsTable);

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  debate: state.debate
});

export default connect(mapStateToProps)(DebateWithData);