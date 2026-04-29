import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading as AriaHeading,
  Input as AriaInput,
  type Key,
  Link as AriaLink,
  ListBox as AriaListBox,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from 'react-aria-components'
import classNames from 'classnames'
import { Children, isValidElement, type ReactNode, useMemo, useRef, useState } from 'react'
import { useFilter } from 'react-aria'

import { XmarkIcon } from './icons'
import styles from './MobileCombobox.module.css'

export type MobileComboboxProps = {
  label: string
  placeholder?: string
  value?: Key | null
  onChange?: (value: Key | null) => void
  /** `ListBoxItem` children — rendered inside the tray listbox. */
  children: ReactNode
  /** Optional link rendered below the listbox inside the tray. */
  bottomLink?: { label: string; href: string }
}

/**
 * iOS-style tray pattern modelled on React Spectrum's `MobileComboBox`:
 *   1. Trigger is a button that *looks like* a closed combobox.
 *   2. Tapping it opens a bottom-sheet tray.
 *   3. The input inside the tray uses `role="searchbox"` with
 *      `aria-haspopup="listbox"` and **no `aria-expanded`** — VoiceOver
 *      otherwise announces "double tap to collapse" on a `combobox` role,
 *      fighting the on-screen keyboard.
 *      See https://react-aria.adobe.com/blog/building-a-combobox
 */
export const MobileCombobox = ({
  label,
  placeholder,
  value,
  onChange,
  children,
  bottomLink,
}: MobileComboboxProps) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { contains } = useFilter({ sensitivity: 'base' })

  const filteredChildren = useMemo(() => {
    if (!query.trim()) return children
    return Children.toArray(children).filter((child) => {
      if (!isValidElement(child)) return true
      const itemProps = child.props as { textValue?: string; children?: ReactNode }
      const haystack =
        itemProps.textValue ?? (typeof itemProps.children === 'string' ? itemProps.children : '')
      if (!haystack) return true
      return contains(haystack, query)
    })
  }, [children, query, contains])

  return (
    <AriaDialogTrigger>
      <AriaButton className={classNames(styles.combobox)}>
        {value != null ? String(value) : (placeholder ?? '')}
      </AriaButton>
      <AriaModalOverlay className={styles.trayOverlay} isDismissable>
        <AriaModal className={styles.tray}>
          <AriaDialog className={styles.trayDialog}>
            {({ close }) => (
              <>
                <AriaHeading className={styles.trayHeading} slot='title'>
                  {label}
                </AriaHeading>
                <div className={styles.inputWrapper}>
                  <AriaInput
                    aria-haspopup='listbox'
                    aria-label={label}
                    autoFocus
                    className={styles.input}
                    onChange={(event) => setQuery(event.target.value)}
                    ref={inputRef}
                    role='searchbox'
                    type='text'
                    value={query}
                    {...(placeholder !== undefined && { placeholder })}
                  />
                  {query.length > 0 && (
                    <button
                      aria-label='Clear'
                      className={styles.clearButton}
                      onClick={() => {
                        setQuery('')
                        inputRef.current?.focus()
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      type='button'
                    >
                      <XmarkIcon />
                    </button>
                  )}
                </div>
                <AriaListBox
                  aria-label={label}
                  className={styles.listBox}
                  onSelectionChange={(keys) => {
                    const next = keys === 'all' ? null : (Array.from(keys)[0] ?? null)
                    onChange?.(next)
                    close()
                  }}
                  selectedKeys={value != null ? [value as Key] : []}
                  selectionMode='single'
                >
                  {filteredChildren}
                </AriaListBox>
                {bottomLink && (
                  <AriaLink
                    className={styles.bottomLink}
                    href={bottomLink.href}
                    onPress={() => close()}
                  >
                    {bottomLink.label}
                  </AriaLink>
                )}
              </>
            )}
          </AriaDialog>
        </AriaModal>
      </AriaModalOverlay>
    </AriaDialogTrigger>
  )
}

MobileCombobox.displayName = 'MobileCombobox'
