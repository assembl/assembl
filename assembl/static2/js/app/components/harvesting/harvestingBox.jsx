// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';

type Props = {
  extract: ?string
};

type State = {
  disabled: boolean,
  checkIsActive: boolean
};

class HarvestingBox extends React.Component<void, Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      disabled: true,
      checkIsActive: false
    };
  }

  validateHarvesting = (): void => {
    this.setState({
      disabled: false,
      checkIsActive: true
    });
  };

  cancelHarvesting = (): void => {
    this.setState({ disabled: true });
  };

  render() {
    const { extract } = this.props;
    const { disabled, checkIsActive } = this.state;
    return (
      <div className="theme-box harvesting-box">
        <div className="harvesting-box-header">
          <div className="profil">
            <span className="assembl-icon-profil grey" />
            <span className="username">Pauline Thomas</span>
          </div>
          <div className="button-bar">
            <Button disabled={disabled} className={classnames({ active: checkIsActive })}>
              <span className="assembl-icon-check grey" />
            </Button>
            <Button disabled={disabled}>
              <span className="assembl-icon-edit grey" />
            </Button>
            <Button disabled={disabled}>
              <span className="assembl-icon-delete grey" />
            </Button>
            <Button disabled={disabled}>
              <span className="assembl-icon-pepite grey" />
            </Button>
          </div>
        </div>
        <div className="harvesting-box-body">
          <div>
            {disabled ? (
              <div className="harvesting-in-progress">
                <span className="confirm-harvest-button assembl-icon-catch" />&nbsp;<Translate value="harvesting.inProgress" />
              </div>
            ) : (
              <div className="validated-harvesting">
                <span className="confirm-harvest-button assembl-icon-catch" />
                &nbsp;
                <Translate value="harvesting.validatedHarvesting" />
              </div>
            )}
          </div>
          <div>{extract}</div>
        </div>
        <div className="harvesting-box-footer">
          <Button className="button-submit button-dark" onClick={this.validateHarvesting}>
            <Translate value="common.attachFileForm.submit" />
          </Button>
          <Button className="button-cancel button-dark" onClick={this.cancelHarvesting}>
            <Translate value="debate.confirmDeletionButtonCancel" />
          </Button>
        </div>
      </div>
    );
  }
}

export default HarvestingBox;