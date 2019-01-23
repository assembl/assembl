// @flow
/*
Wrapper component for react-final-form that loads data from server (graphql query) then
normalize this data to form values.
When user submit the form, form values are "transformed" in graphql mutations.
save function is expected to return a status ()

This component is inspired by React Final Form Example - Load, Save, and Reinitialize
https://github.com/final-form/react-final-form#loading-normalizing-saving-and-reinitializing
*/
import * as React from 'react';
import { type Mutator } from 'final-form';
import { Form } from 'react-final-form';
import type { MutationsPromises, SaveStatus } from './types.flow';
import { displayConfirmationModal } from '../common/displayConfirmationModal';

type TOriginalValues = {| [string]: any |};

export type TInitialValues = { [string]: any };

type Props = {
  load: (fetchPolicy: FetchPolicy) => Promise<TOriginalValues>,
  loading: React.Node,
  postLoadFormat: ?(TOriginalValues) => TInitialValues,
  createMutationsPromises: (TInitialValues, TInitialValues) => MutationsPromises,
  save: MutationsPromises => Promise<SaveStatus>,
  afterSave?: TInitialValues => void,
  mutators?: { [string]: Mutator },
  warningMessageKey?: string,
  withWarningModal?: boolean,
  warningValues?: Array<string>
};

type State = {
  initialValues: ?TInitialValues,
  isLoading: boolean,
  originalValues: ?TOriginalValues
};

export default class LoadSaveReinitializeForm extends React.Component<Props, State> {
  state = {
    isLoading: false,
    originalValues: undefined,
    initialValues: undefined
  };

  componentDidMount() {
    this.load();
  }

  load = async (fetchPolicy: FetchPolicy = 'cache-first') => {
    const { load, postLoadFormat } = this.props;
    this.setState({ isLoading: true });
    const originalValues = await load(fetchPolicy);
    const initialValues = postLoadFormat ? postLoadFormat(originalValues) : originalValues;
    this.setState({
      isLoading: false,
      initialValues: initialValues
    });
  };

  runMutations = async (values: TInitialValues) => {
    const { createMutationsPromises, save, afterSave } = this.props;
    // $FlowFixMe flow doesn't see that initialValues has already been checked
    const mutationPromises = createMutationsPromises(values, this.state.initialValues);
    const status = await save(mutationPromises);
    if (status === 'OK') {
      // we really need to do a refetch to have the correct new ids in values
      await this.load('network-only');
      if (afterSave) afterSave(values);
    }
  };

  save = (values: TInitialValues) => {
    const { withWarningModal, warningValues, warningMessageKey } = this.props;
    const { initialValues } = this.state;
    // We check if any of the values that need to be warned about have been changed
    const warningValuesHaveChanged =
      warningValues && initialValues && warningValues.some(value => values[value] !== initialValues[value]);
    if (withWarningModal && warningValuesHaveChanged && warningMessageKey) {
      return displayConfirmationModal(values, this.runMutations, warningMessageKey);
    }
    return this.runMutations(values);
  };

  render() {
    const { load, loading, postLoadFormat, createMutationsPromises, save, ...rest } = this.props;
    const { isLoading, initialValues } = this.state;
    return isLoading || !initialValues ? loading : <Form {...rest} initialValues={initialValues} onSubmit={this.save} />;
  }
}