import React from 'react';

class surveyExport extends React.Component {
  render() {
    const { showSection } = this.props;
    return (
      <p className={showSection ? 'shown' : 'hidden'}>surveyExport assembl</p>
    );
  }
}

export default surveyExport;