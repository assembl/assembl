// @flow
import * as React from 'react';

import Slider from '@material-ui/lab/Slider';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import ToolbarSliderIcon from './toolbarSliderIcon';

export type State = {
  currentValue: number
};

export type Props = {
  max?: number,
  min?: number,
  defaultValue: number,
  onSliderChange: (value: number) => void,
  labelFormatter?: (value: number) => string,
  color?: string
};

class ToolbarSlider extends React.Component<Props, State> {
  static defaultProps = {
    max: 100,
    min: 0,
    labelFormatter: (value: number) => value.toString(),
    color: '#000'
  };

  static getDerivedStateFromProps(nextProps: Props) {
    const { defaultValue } = nextProps;
    return {
      currentValue: defaultValue
    };
  }

  state = {
    currentValue: 0
  };

  render() {
    const { max, min, onSliderChange, defaultValue, labelFormatter, color } = this.props;
    const { currentValue } = this.state;

    const onSliderChangeHandler = (value: number) => {
      this.setState({ currentValue: value || defaultValue });
      onSliderChange(value);
    };

    const theme = createMuiTheme({
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

    return (
      <MuiThemeProvider theme={theme}>
        <Slider
          max={max}
          min={min}
          step={10}
          value={currentValue}
          className="slider"
          onChange={onSliderChangeHandler}
          thumb={
            <ToolbarSliderIcon
              value={labelFormatter ? labelFormatter(currentValue) : currentValue.toString()}
              classText="sliderText"
            />
          }
        />
      </MuiThemeProvider>
    );
  }
}

export default ToolbarSlider;