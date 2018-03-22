// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

type Props = {
  positionX: number,
  positionY: number,
  serialized: Object
};

type State = {
  disabled: boolean
};

class HarvestingBox extends React.Component<void, Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      disabled: true
    };
  }

  validateHarvesting = (): void => {
    this.setState({ disabled: false });
  };

  cancelHarvesting = (): void => {
    this.setState({ disabled: true });
  };

  getHarvestingContent() {
    const { serialized } = this.props;
    const postId = serialized.start.split('@id=\'')[1].split('\']/')[0];
    const elm = document.getElementById(postId);
    const postText = elm ? elm.textContent : '';

    return postText.substring(serialized.startOffset, serialized.endOffset);
  }

  render() {
    const { positionX, positionY } = this.props;
    const { disabled } = this.state;
    const harvestingContent = this.getHarvestingContent();
    return (
      <div style={{ top: positionY, left: positionX }} className="theme-box harvesting-box">
        <div className="harvesting-box-header">
          <div className="profil">
            <span className="assembl-icon-profil grey" />
            <span className="username">Pauline Thomas</span>
          </div>
          <div className="button-bar">
            <Button disabled={disabled}>
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
        <div className="harvesting-box-body">{harvestingContent}</div>
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