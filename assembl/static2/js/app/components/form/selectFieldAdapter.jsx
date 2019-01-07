// @flow
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { type FieldRenderProps } from 'react-final-form';
import { ControlLabel, FormGroup } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import classNames from 'classnames';
import Creatable from 'react-select/lib/Creatable';
import Select from 'react-select';
import AsyncCreatableSelect from 'react-select/lib/AsyncCreatable';
import AsyncSelect from 'react-select/lib/Async';
import makeAnimated from 'react-select/lib/animated';
import debounce from 'lodash/debounce';

import Error from './error';
import { getValidationState } from './utils';

export type Option = {
  value: string,
  label: string
};

type Props = {
  isMulti: boolean,
  isAsync: boolean,
  canCreate: boolean,
  required: boolean,
  label: string,
  classNamePrefix: string,
  placeholder: string,
  className?: string,
  components: { [string]: any },
  noOptionsMessage: () => React.Node,
  formatCreateLabel: string => React.Node,
  options?: Array<Option>,
  loadOptions?: (string, (Array<Option>) => void) => Promise<*> | null,
  input: {
    name: string,
    onChange: (SyntheticInputEvent<*> | any) => void,
    value?: Array<Option> | Option
  }
} & FieldRenderProps;

type State = {
  direction: 'up' | 'down',
  inputValue: string
};

const SELECT_MENU_HEIGHT = 300;

class SelectFieldAdapter extends React.Component<Props, State> {
  static defaultProps = {
    required: false,
    isMulti: false,
    isAsync: false,
    canCreate: false,
    options: [],
    components: {},
    className: '',
    classNamePrefix: 'select-field',
    placeholder: 'form.select.placeholder',
    noOptionsMessage: () => <Translate value="form.select.noOptions" />,
    formatCreateLabel: (newOption: string) => <Translate value="form.select.newOption" option={newOption} />
  };

  state = {
    direction: 'down',
    inputValue: ''
  };

  componentDidMount() {
    window.addEventListener('scroll', this.onPositionChange);
    this.onPositionChange();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onPositionChange);
  }

  select: { current: null | HTMLDivElement } = React.createRef();

  onPositionChange = debounce(() => {
    const selectRef = this.select.current;
    const selectDom = selectRef && ReactDOM.findDOMNode(selectRef); //eslint-disable-line
    if (selectDom) {
      const { direction } = this.state;
      // $FlowFixMe the select is not a Text
      const screenTop = selectDom.getBoundingClientRect().top;
      const newDirection = window.innerHeight - screenTop < SELECT_MENU_HEIGHT ? 'up' : 'down';
      if (direction !== newDirection) {
        this.setState({ direction: newDirection });
      }
    }
  }, 100);

  handleInputChange = (inputValue: string, { action }: { action: string }) => {
    if (action === 'input-change') {
      this.setState({ inputValue: inputValue });
    } else {
      this.setState({ inputValue: '' });
    }
  };

  initializeInput = () => {
    const { isMulti, input: { value } } = this.props;
    // $FlowFixMe the value in this context is an Option
    const currentValue: string = (!isMulti && value && value.label) || '';
    this.setState({ inputValue: currentValue });
  };

  removeInput = () => {
    this.setState({ inputValue: '' });
  };

  render() {
    const {
      isMulti,
      isAsync,
      canCreate,
      required,
      label,
      placeholder,
      className,
      options,
      loadOptions,
      components,
      input: { name, onChange, value, ...otherListeners },
      meta: { error, touched },
      ...rest
    } = this.props;
    const { direction, inputValue } = this.state;
    const decoratedLabel = label && required ? `${label} *` : label;
    let SelectComponent = null;
    if (isAsync) {
      SelectComponent = canCreate ? AsyncCreatableSelect : AsyncSelect;
    } else {
      SelectComponent = canCreate ? Creatable : Select;
    }
    return (
      <FormGroup controlId={name} validationState={getValidationState(error, touched)}>
        {decoratedLabel ? <ControlLabel>{decoratedLabel}</ControlLabel> : null}
        <SelectComponent
          // $FlowFixMe select is not a StateManager
          ref={this.select}
          className={classNames('select-field', className, { 'expand-up': direction === 'up' })}
          {...otherListeners}
          {...rest}
          cacheOptions
          defaultOptions
          backspaceRemovesValue={false}
          isMulti={isMulti}
          name={name}
          placeholder={I18n.t(placeholder)}
          defaultValue={value}
          inputValue={inputValue}
          onInputChange={this.handleInputChange}
          onFocus={this.initializeInput}
          onBlur={this.removeInput}
          options={options}
          loadOptions={loadOptions}
          onChange={onChange}
          components={{ ...makeAnimated(), ...components }}
        />
        <Error name={name} />
      </FormGroup>
    );
  }
}

export default SelectFieldAdapter;