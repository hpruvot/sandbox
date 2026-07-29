import type {
  ComboBoxProps as AriaComboBoxProps,
  Key,
  ListBoxItemProps as AriaListBoxItemProps,
  SectionProps as AriaSectionProps,
} from 'react-aria-components'
import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  Header as AriaHeader,
  Input as AriaInput,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection as AriaSection,
  Popover as AriaPopover,
} from 'react-aria-components'
import classNames from 'classnames'
import {
  Children,
  forwardRef,
  isValidElement,
  type MutableRefObject,
  type ReactNode,
  useId,
  useRef,
  useState,
} from 'react'

import {
  computeAriaDescribedBy,
  Field,
  type FieldState,
  getFieldInputId,
  getFieldLabelId,
} from './Field'
import { ChevronDownIcon, CircleCheckIcon } from './icons'
import { MobileMultiComboBox } from './MobileMultiComboBox'
import { Pill } from './Pill'
import { usePlatform } from './usePlatform'
import styles from './MultiComboBox.module.css'

export type MultiComboBoxProps = Omit<
  AriaComboBoxProps<object, 'multiple'>,
  | 'children'
  | 'className'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby'
  | 'selectionMode'
  | 'value'
  | 'defaultValue'
  | 'onChange'
> & {
  label: string
  hint?: string
  message?: string
  state?: FieldState
  placeholder?: string
  showRequirementLabel?: boolean
  /** Selected keys. Passing `onChange` makes the component controlled. */
  value?: Key[]
  /** Initial selected keys (uncontrolled). */
  defaultValue?: Key[]
  onChange?: (value: Key[]) => void
  /** `MultiComboBoxItem` / `MultiComboBoxSection` children — renders inside the popover listbox. */
  children: ReactNode
}

/**
 * Multi-select combobox POC. Deliberately deviates from the single-select
 * `ComboBox` next door on two points, both driven by accessibility, not taste:
 *
 * 1. The text `role=combobox` never carries selection state itself — WAI-ARIA
 *    APG's combobox pattern is single-select by spec (aria-activedescendant
 *    tracks ONE focused option). Multi-select semantics live on the popup:
 *    `role=listbox` + `aria-multiselectable="true"` + `aria-selected` per
 *    option (RAC sets these automatically for `selectionMode="multiple"`).
 * 2. Selected items render as a separate row of real, independently
 *    focusable `<button>`s (`Pill`), OUTSIDE the listbox's
 *    activedescendant chain. A `<button>` nested inside `role=option` has no
 *    reliable AT path to reach/activate it — see the sibling `combobox/` POC
 *    (`ListboxWithButtonsDemo`), which already demonstrated this failure for
 *    the single-select case. Keeping pills as ordinary DOM siblings means
 *    Tab/Enter/Space "just work" with zero custom key handling.
 *
 * The popover stays open across selections (multi-select's entire point);
 * the input's filter text is NOT overwritten by the selected item's label
 * the way the single ComboBox does — there is no one label to show.
 */
export const MultiComboBox = forwardRef<HTMLInputElement, MultiComboBoxProps>(
  (props, ref) => {
    const {
      label,
      hint,
      message,
      state,
      placeholder,
      isDisabled = false,
      isRequired,
      showRequirementLabel,
      value,
      defaultValue,
      onChange,
      children,
      inputValue: consumerInputValue,
      onInputChange: consumerOnInputChange,
      ...comboBoxProps
    } = props

    const id = useId()
    const listboxId = `${id}-listbox`
    const ariaDescribedBy = computeAriaDescribedBy({ hint, message, id })

    const isControlled = onChange !== undefined
    const [uncontrolledValue, setUncontrolledValue] = useState<Key[]>(value ?? defaultValue ?? [])
    const selectedKeys = isControlled ? value ?? [] : uncontrolledValue

    const [inputValue, setInputValue] = useState(consumerInputValue ?? '')
    const [announcement, setAnnouncement] = useState('')
    const innerInputRef = useRef<HTMLInputElement | null>(null)

    const mergeInputRef = (node: HTMLInputElement | null) => {
      innerInputRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node
    }

    const handleInputChange = (next: string) => {
      setInputValue(next)
      consumerOnInputChange?.(next)
    }

    const setSelection = (next: Key[], announceText: string) => {
      if (!isControlled) setUncontrolledValue(next)
      onChange?.(next)
      setAnnouncement(announceText)
    }

    // RAC's own `value`/`onChange` for `selectionMode="multiple"` fires with
    // the full next set of keys (not a single toggled key), matching
    // `ComboBoxState.value: Key[]`.
    const handleRacChange = (keys: Key[]) => {
      const added = keys.filter((k) => !selectedKeys.includes(k))
      const removed = selectedKeys.filter((k) => !keys.includes(k))
      const changedKey = added[0] ?? removed[0]
      const text = changedKey != null ? findOptionText(children, changedKey) : undefined
      const verb = added.length > 0 ? 'Added' : 'Removed'
      setSelection(
        keys,
        `${verb}${text ? `: ${text}` : ''}. ${keys.length} selected.`,
      )
    }

    const handlePillDelete = (key: Key) => {
      const text = findOptionText(children, key)
      setSelection(
        selectedKeys.filter((k) => k !== key),
        `Removed${text ? `: ${text}` : ''}. ${selectedKeys.length - 1} selected.`,
      )
      innerInputRef.current?.focus()
    }

    const { isOnSmallScreen } = usePlatform()

    if (isOnSmallScreen) {
      return <MobileMultiComboBox {...props} />
    }

    return (
      <Field
        hint={hint}
        id={id}
        isDisabled={isDisabled}
        isRequired={isRequired}
        label={label}
        message={message}
        showRequirementLabel={showRequirementLabel}
        state={state}
      >
        <AriaComboBox
          aria-describedby={ariaDescribedBy}
          aria-labelledby={getFieldLabelId(id)}
          className={classNames(styles.combobox, {
            [styles.isDisabled]: isDisabled,
            [styles.isError]: state === 'error',
          })}
          inputValue={consumerInputValue ?? inputValue}
          isDisabled={isDisabled}
          isInvalid={state === 'error'}
          isRequired={isRequired}
          menuTrigger='focus'
          onInputChange={handleInputChange}
          selectionMode='multiple'
          value={selectedKeys}
          onChange={handleRacChange}
          {...comboBoxProps}
        >
          {selectedKeys.length > 0 && (
            <ul aria-label={`Selected ${label}`} className={styles.pillList}>
              {selectedKeys.map((key) => (
                <Pill
                  deleteAriaLabel={`Remove ${findOptionText(children, key) ?? String(key)}`}
                  key={String(key)}
                  label={findOptionText(children, key) ?? String(key)}
                  onDelete={() => handlePillDelete(key)}
                />
              ))}
            </ul>
          )}
          <AriaInput
            aria-controls={listboxId}
            className={styles.input}
            id={getFieldInputId(id)}
            ref={mergeInputRef}
            {...(placeholder !== undefined && { placeholder })}
          />
          <AriaButton className={styles.triggerButton}>
            <ChevronDownIcon />
          </AriaButton>
          <AriaPopover
            className={classNames(styles.popover, styles.popoverWidth)}
            offset={4}
          >
            <AriaListBox
              className={styles.listBox}
              id={listboxId}
              renderEmptyState={() => <div className={styles.emptyState}>No results</div>}
              selectionMode='multiple'
            >
              {children}
            </AriaListBox>
          </AriaPopover>
        </AriaComboBox>
        <div aria-live='polite' className={styles.visuallyHidden} role='status'>
          {announcement}
        </div>
      </Field>
    )
  },
)

MultiComboBox.displayName = 'MultiComboBox'

export const MultiComboBoxItem = ({
  children,
  ...props
}: Omit<AriaListBoxItemProps, 'children'> & { children?: ReactNode }) => (
  <AriaListBoxItem
    {...props}
    className={styles.option}
    textValue={props.textValue ?? (typeof children === 'string' ? children : undefined)}
  >
    {({ isSelected }) => (
      <>
        <span className={styles.optionLabel}>{children}</span>
        {isSelected && <CircleCheckIcon className={styles.optionCheck} />}
      </>
    )}
  </AriaListBoxItem>
)

MultiComboBoxItem.displayName = 'MultiComboBoxItem'

export type MultiComboBoxSectionProps = Omit<AriaSectionProps<object>, 'children'> & {
  title: string
  children: ReactNode
}

export const MultiComboBoxSection = ({ title, children, ...props }: MultiComboBoxSectionProps) => (
  <AriaSection {...props}>
    <AriaHeader className={styles.sectionHeader}>{title}</AriaHeader>
    {children}
  </AriaSection>
)

MultiComboBoxSection.displayName = 'MultiComboBoxSection'

// Walk `MultiComboBox` children (Items + Sections) and return the visible
// text for the option whose `id` matches `key`. Used for pill labels and
// live-region announcements — the component never receives item labels any
// other way (RAC's collection API is DOM-shaped, not data-shaped).
export function findOptionText(children: ReactNode, key: Key | undefined): string | undefined {
  if (key == null) return undefined
  let result: string | undefined

  const visit = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (result !== undefined || !isValidElement(child)) return
      const childProps = child.props as { id?: Key; textValue?: string; children?: ReactNode }

      if (childProps.id === key) {
        result =
          typeof childProps.textValue === 'string'
            ? childProps.textValue
            : typeof childProps.children === 'string'
              ? childProps.children
              : ''
        return
      }

      if (childProps.children !== undefined) visit(childProps.children)
    })
  }

  visit(children)
  return result
}
