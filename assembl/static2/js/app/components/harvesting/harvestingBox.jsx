// @flow
import React from 'react';
import ARange from 'annotator_range'; // eslint-disable-line
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';

type Props = {
  extract: ?Object, // TODO change type
  index: number,
  cancelHarvesting: Function
};

type State = {
  disabled: boolean,
  checkIsActive: boolean,
  isNugget: boolean
};

class HarvestingBox extends React.Component<void, Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    const { extract } = this.props;
    const isExtract = extract !== null;
    const isNugget = extract ? extract.important : false;
    this.state = {
      disabled: !isExtract,
      checkIsActive: isExtract,
      isNugget: isNugget
    };
  }

  validateHarvesting = (): void => {
    this.setState({
      disabled: false,
      checkIsActive: true
    });
  };

  render() {
    const selection = window.getSelection().toString();
    const { cancelHarvesting, extract, index } = this.props;
    const { disabled, checkIsActive, isNugget } = this.state;
    const isExtract = extract !== null;

    // const selection = window.getSelection();
    // const browserRange = ARange.sniff(selection.getRangeAt(0));
    // const serialized = browserRange.serialize(document, 'annotation');
    // console.log(serialized); // eslint-disable-line

    return (
      <div
        className={classnames('theme-box', 'harvesting-box', { 'active-box': checkIsActive })}
        style={{ marginTop: `${20 + 180 * index}px` }} // TODO fix the position
      >
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
            <Button disabled={disabled} className={classnames({ active: isNugget })}>
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
          {isExtract && extract && <div>{extract.body}</div>}
          {!isExtract && <div>{selection}</div>}
        </div>
        {disabled && (
          <div className="harvesting-box-footer">
            <Button className="button-submit button-dark" onClick={this.validateHarvesting}>
              <Translate value="common.attachFileForm.submit" />
            </Button>
            <Button className="button-cancel button-dark" onClick={cancelHarvesting}>
              <Translate value="debate.confirmDeletionButtonCancel" />
            </Button>
          </div>
        )}
      </div>
    );
  }
}

export default HarvestingBox;