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
import { displayConfirmationModal } from '../../utils/administration/displayConfirmationModal';

export type TValues = { [string]: any };

type Props<TOriginalValues, TFormValues> = {
  load: (fetchPolicy: FetchPolicy) => Promise<TOriginalValues>,
  loading: React.Node,
  postLoadFormat: ?(TOriginalValues) => TFormValues,
  // createMutationsPromises(currentValues, nextValues)
  createMutationsPromises: (TFormValues, TFormValues) => MutationsPromises,
  save: MutationsPromises => Promise<SaveStatus>,
  afterSave?: TFormValues => void,
  mutators?: { [string]: Mutator },
  warningMessageKey?: string,
  withWarningModal?: boolean,
  warningValues?: Array<string>
};

type State<TOriginalValues, TInitialValues> = {
  initialValues: ?TInitialValues,
  isLoading: boolean,
  originalValues: ?TOriginalValues
};

export default class LoadSaveReinitializeForm<TO: { [string]: any }, TI: { [string]: any }> extends React.Component<
  Props<TO, TI>,
  State<TO, TI>
> {
  state: State<TO, TI> = {
    initialValues: undefined,
    isLoading: false,
    originalValues: undefined
  };

  componentDidMount() {
    this.load();
  }

  load = async (fetchPolicy: FetchPolicy = 'cache-first') => {
    const { load, postLoadFormat } = this.props;
    this.setState({ isLoading: true });
    const originalValues: TO = await load(fetchPolicy);
    const initialValues: TI = postLoadFormat ? postLoadFormat((originalValues: any)) : (originalValues: any);
    this.setState({
      isLoading: false,
      initialValues: initialValues
    });
  };

  runMutations = async (values: TI) => {
    const { createMutationsPromises, save, afterSave } = this.props;
    if (this.state.initialValues) {
      const mutationPromises = createMutationsPromises(values, this.state.initialValues);
      const status = await save(mutationPromises);
      if (status === 'OK') {
        // we really need to do a refetch to have the correct new ids in values
        await this.load('network-only');
        if (afterSave) afterSave(values);
      }
    }
  };

  save = (values: Object) => {
    const { withWarningModal, warningValues, warningMessageKey } = this.props;
    const { initialValues } = this.state;
    // We check if any of the values that need to be warned about have been changed
    const warningValuesHaveChanged =
      warningValues && initialValues && warningValues.some(value => values.get(value) !== initialValues.get(value));
    if (withWarningModal && warningValuesHaveChanged && warningMessageKey) {
      return displayConfirmationModal(() => this.runMutations((values: any)), warningMessageKey);
    }
    return this.runMutations((values: any)); // flow bug ?
  };

  render() {
    const { load, loading, postLoadFormat, createMutationsPromises, save, ...rest } = this.props;
    const { isLoading, initialValues } = this.state;
    return isLoading || !initialValues ? (
      loading
    ) : (
      <Form {...rest} initialValues={initialValues} onSubmit={values => this.save(values)} />
    );
  }
}