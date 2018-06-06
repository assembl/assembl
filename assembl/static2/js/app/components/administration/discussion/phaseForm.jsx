import React from 'react';

export class DumbPhaseForm extends React.Component {
  render() {
    const { phaseId, editLocale } = this.props;
    return <div>Phase Form {phaseId} {editLocale}</div>;
  }
}

export default DumbPhaseForm;