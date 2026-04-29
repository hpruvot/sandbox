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
  Popover as AriaPopover,
  Section as AriaSection,
} from 'react-aria-components'
import classNames from 'classnames'
import {
  Children,
  forwardRef,
  isValidElement,
  type MutableRefObject,
  type ReactNode,
  useId,
  useLayoutEffect,
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
import { ChevronDownIcon, XmarkIcon } from './icons'
import { MobileCombobox } from './MobileCombobox'
import { usePlatform } from './usePlatform'
import styles from './Combobox.module.css'

/**
 * Optional link rendered below the listbox. Tabbing from the input/listbox
 * focuses the link before leaving the popover.
 */
export type ComboboxBottomLink = {
  label: string
  href: string
}

export type ComboboxProps = Omit<
  AriaComboBoxProps<object>,
  | 'children'
  | 'className'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby'
  | 'selectedKey'
  | 'defaultSelectedKey'
  | 'onSelectionChange'
> & {
  /** Visible label above the field. Required. */
  label: string
  /** Short help shown below the label. */
  hint?: string
  /** Message shown below the field. Combined with `state` to surface errors. */
  message?: string
  /** Validation state. */
  state?: FieldState
  /** Placeholder shown when the field is empty. */
  placeholder?: string
  /** Shows a required/optional marker next to the label. */
  showRequirementLabel?: boolean
  /** Currently selected option key (controlled). */
  value?: Key | null
  /** Default selected option key (uncontrolled). */
  defaultValue?: Key
  /** Called when the selected option changes. */
  onChange?: (value: Key | null) => void
  /** `ListBoxItem` / `Section` children — renders inside the popover listbox. */
  children: ReactNode
  /** Optional link rendered below the listbox inside the popover. */
  bottomLink?: ComboboxBottomLink
}

/**
 * `Combobox` — accessibility-first wrapper around `react-aria-components`'
 * `ComboBox`, rendered inside a small field chrome (label/hint/message).
 * Switches to a tray pattern on small screens.
 */
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>((props, ref) => {
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
    bottomLink,
    ...comboBoxProps
  } = props

  const id = useId()
  const listboxId = `${id}-listbox`
  const ariaDescribedBy = computeAriaDescribedBy({ hint, message, id })

  // Seed the controlled inputValue from the option matching `defaultValue`.
  // RAC's `useComboBoxState` skips the initial input/key sync when the consumer
  // controls inputValue, so we resolve the option text ourselves on mount.
  const [inputValue, setInputValue] = useState(() => findOptionText(children, defaultValue) ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const innerInputRef = useRef<HTMLInputElement | null>(null)
  const bottomLinkRef = useRef<HTMLAnchorElement | null>(null)

  const mergeInputRef = (node: HTMLInputElement | null) => {
    innerInputRef.current = node

    if (typeof ref === 'function') ref(node)
    else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node
  }

  const handleOpenChange = (next: boolean) => {
    setIsOpen(next)
    comboBoxProps.onOpenChange?.(next)
  }

  // Tab trap between the combobox input (whose virtual focus drives the listbox)
  // and the bottom link. Window capture intercepts Tab before react-aria's
  // FocusScope (document capture) can blur focus when no tabbable element exists
  // outside the popover.
  useLayoutEffect(() => {
    if (!bottomLink || !isOpen) return undefined

    const handler = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return
      const input = innerInputRef.current
      const link = bottomLinkRef.current
      if (!input || !link) return
      const active = input.ownerDocument.activeElement

      if (active === input) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        link.focus()
      } else if (active === link) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        input.focus()
      }
    }

    const win = innerInputRef.current?.ownerDocument.defaultView ?? window
    win.addEventListener('keydown', handler, true)
    return () => win.removeEventListener('keydown', handler, true)
  }, [bottomLink, isOpen])

  const { isOnSmallScreen } = usePlatform()

  if (isOnSmallScreen) {
    return <MobileCombobox {...props} />
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
        inputValue={inputValue}
        isDisabled={isDisabled}
        isInvalid={state === 'error'}
        isRequired={isRequired}
        onInputChange={setInputValue}
        {...(value !== undefined && { selectedKey: value })}
        {...(defaultValue !== undefined && { defaultSelectedKey: defaultValue })}
        {...(onChange !== undefined && { onSelectionChange: onChange })}
        {...comboBoxProps}
        onOpenChange={handleOpenChange}
      >
        <AriaInput
          aria-controls={listboxId}
          className={styles.input}
          id={getFieldInputId(id)}
          ref={mergeInputRef}
          {...(placeholder !== undefined && { placeholder })}
        />
        {inputValue.length > 0 && (
          <button
            aria-label='Clear'
            className={styles.clearButton}
            onClick={() => {
              setInputValue('')
              innerInputRef.current?.focus()
            }}
            onMouseDown={(event) => event.preventDefault()}
            type='button'
          >
            <XmarkIcon />
          </button>
        )}
        <AriaButton className={styles.triggerButton}>
          <ChevronDownIcon />
        </AriaButton>
        <AriaPopover
          className={classNames(styles.popover, styles.popoverWidth)}
          offset={4}
          // When a bottomLink is rendered, RAC's popover would close as soon as
          // focus moves from the link back to the input (the input sits outside
          // the popover scope). Treating the input as "inside" keeps it open.
          {...(bottomLink && {
            shouldCloseOnInteractOutside: (element: Element) => element !== innerInputRef.current,
          })}
        >
          {bottomLink ? (
            <div aria-label={label} className={styles.dialog} role='dialog'>
              <AriaListBox className={styles.listBox} id={listboxId} selectionMode='single'>
                {children}
              </AriaListBox>
              <a
                className={styles.bottomLink}
                href={bottomLink.href}
                ref={bottomLinkRef}
              >
                {bottomLink.label}
              </a>
            </div>
          ) : (
            <AriaListBox className={styles.listBox} id={listboxId} selectionMode='single'>
              {children}
            </AriaListBox>
          )}
        </AriaPopover>
      </AriaComboBox>
    </Field>
  )
})

Combobox.displayName = 'Combobox'

/**
 * A single option inside `Combobox`. Pass the option label as children — use
 * `textValue` for rich content so screen readers still get a clean accessible name.
 */
export const ComboboxItem = (props: AriaListBoxItemProps) => (
  <AriaListBoxItem {...props} className={styles.option} />
)

ComboboxItem.displayName = 'ComboboxItem'

export type ComboboxSectionProps = Omit<AriaSectionProps<object>, 'children'> & {
  title: string
  children: ReactNode
}

/** A group of options with a non-selectable heading. */
export const ComboboxSection = ({ title, children, ...props }: ComboboxSectionProps) => (
  <AriaSection {...props}>
    <AriaHeader className={styles.sectionHeader}>{title}</AriaHeader>
    {children}
  </AriaSection>
)

ComboboxSection.displayName = 'ComboboxSection'

// Walk a `Combobox` children tree (Items + Sections) and return the visible
// text for the option whose `id` matches `key`. Used to seed the controlled
// `inputValue` from `defaultValue` on mount.
function findOptionText(children: ReactNode, key: Key | undefined): string | undefined {
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
