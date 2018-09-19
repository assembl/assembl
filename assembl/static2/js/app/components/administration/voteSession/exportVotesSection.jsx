// @flow
import React from 'react';
import { FormGroup, Radio } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

import ExportSection from '../exportSection';
import { get } from '../../../utils/routeMap';

type Props = {
  debateId: string,
  voteSessionId: string
};

type State = {
  exportRoute: string
};

class ExportVotesSection extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      exportRoute: 'vote_results_csv'
    };
  }

  handleRouteChange = (e: SyntheticInputEvent<HTMLInputElement>): void => {
    this.setState({
      exportRoute: e.target.value
    });
  };

  getExportLink = () => {
    const { debateId, voteSessionId } = this.props;
    const { exportRoute } = this.state;
    return get('exportVoteSessionData', {
      debateId: debateId,
      exportRoute: exportRoute,
      voteSessionId: voteSessionId
    });
  };

  render() {
    const options = ['vote_results_csv', 'extract_csv_voters'];
    return (
      <ExportSection
        exportLink={this.getExportLink()}
        annotation="voteSessionAnnotation"
        renderAdditionalFields={() => (
          <FormGroup>
            {options.map(option => (
              <Radio
                key={option}
                checked={this.state.exportRoute === option}
                name="exportLink"
                value={option}
                onChange={this.handleRouteChange}
              >
                <Translate value={`administration.export.vote.${option}`} />
              </Radio>
            ))}
          </FormGroup>
        )}
      />
    );
  }
}

export default ExportVotesSection;