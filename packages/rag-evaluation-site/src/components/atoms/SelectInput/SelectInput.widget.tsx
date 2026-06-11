import { SelectInput } from './SelectInput';
import { defineWidget } from '../../../widgets/registry';
import type { SelectInputWidgetProps } from '../../../widgets/ir';

export const selectInputWidget = defineWidget<SelectInputWidgetProps>({
  type: 'SelectInput',
  module: 'ui.dsl',
  render: (props, children, ctx) => {
    const selectedOption = (props.options ?? []).find((option) => option.selected);
    const defaultValue = props.defaultValue ?? props.value ?? selectedOption?.value;

    return (
      <SelectInput
        className={props.className}
        name={props.name}
        defaultValue={defaultValue}
        disabled={props.disabled}
        required={props.required}
        aria-invalid={props.ariaInvalid || undefined}
      >
        {(props.options ?? []).map((option) => (
          <option key={String(option.value)} value={option.value} disabled={option.disabled}>
            {ctx.renderValue(option.label)}
          </option>
        ))}
        {children}
      </SelectInput>
    );
  },
});
