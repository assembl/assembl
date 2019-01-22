// @flow
import React, { Component } from 'react';

// Helpers imports
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';

// Components imports
import Slider from '@material-ui/lab/Slider';
import ToolbarSliderIcon from './toolbarSliderIcon';

export type State = {
  currentValue: number
};

export type Props = {
  /** Optional slider color */
  color: string,
  /** Default value */
  defaultValue: number, // eslint-disable-line react/no-unused-prop-types
  /** Optional function returning the cursor label from the value */
  labelFormatter: (value: number) => string,
  /** Optional maximum value */
  maxValue: number,
  /** Optional minimum value */
  minValue: number,
  /** Callback function called when slider value changes */
  onSliderChange: (value: number) => void
};

const theme = (color: string): any =>
  createMuiTheme({
    palette: {
      primary: {
        main: color
      }
    },
    typography: {
      useNextVariants: true
    },
    overrides: {
      MuiSlider: {
        thumb: {
          width: '100%',
          '&$focused, &:hover': {
            boxShadow: 'none'
          },
          '&$activated': {
            boxShadow: 'none'
          },
          '&$jumped': {
            boxShadow: 'none'
          }
        }
      }
    }
  });

class ToolbarSlider extends Component<Props, State> {
  static defaultProps = {
    color: '#000',
    labelFormatter: (value: number) => value.toString(),
    maxValue: 100,
    minValue: 0
  };

  state = {
    currentValue: this.props.defaultValue
  };

  render() {
    const { color, labelFormatter, maxValue, minValue, onSliderChange } = this.props;
    const { currentValue } = this.state;

    const onSliderChangeHandler = (event: SyntheticEvent<HTMLButtonElement>, value: number): void => {
      this.setState({ currentValue: value });
      onSliderChange(value);
    };

    return (
      <MuiThemeProvider theme={theme(color)}>
        <Slider
          className="slider"
          max={maxValue}
          min={minValue}
          onChange={onSliderChangeHandler}
          step={10}
          thumb={<ToolbarSliderIcon value={labelFormatter(currentValue)} classText="sliderText" />}
          value={currentValue}
        />
      </MuiThemeProvider>
    );
  }
}

export default ToolbarSlider;