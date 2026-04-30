import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading as AriaHeading,
  type Key,
  Link as AriaLink,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from 'react-aria-components'
import classNames from 'classnames'
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useFilter } from 'react-aria'

import { XmarkIcon } from './icons'
import styles from './MobileCombobox.module.css'

export type MobileComboboxProps = {
  label: string
  placeholder?: string
  value?: Key | null
  onChange?: (value: Key | null) => void
  /** `ComboboxItem` / `ComboboxSection` children. */
  children: ReactNode
  /** Optional link rendered below the list inside the tray. */
  bottomLink?: { label: string; href: string }
  /** Mirrors the desktop API — fired as the user types into the search input. */
  onInputChange?: (value: string) => void
}

type FlatItem = { id: Key; label: string; onAction?: () => void }
type ItemGroup = { title?: string; items: FlatItem[] }

/**
 * Mobile tray combobox. Uses a `searchbox` input + `ul`/`li`/`button` list
 * rather than `role=combobox`/`listbox`/`option`, because iOS VoiceOver does
 * not bridge those roles reliably inside a modal — items go unannounced and
 * `aria-expanded` toggles fight the on-screen keyboard. Selection closes the
 * tray.
 */
export const MobileCombobox = ({
  label,
  placeholder,
  value,
  onChange,
  children,
  bottomLink,
  onInputChange,
}: MobileComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { contains } = useFilter({ sensitivity: 'base' })

  const groups = useMemo(() => extractGroups(children), [children])

  const filteredGroups = useMemo<ItemGroup[]>(() => {
    if (!query.trim()) return groups
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => contains(i.label, query)) }))
      .filter((g) => g.items.length > 0)
  }, [groups, query, contains])

  const totalCount = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.items.length, 0),
    [filteredGroups],
  )

  // Debounce the live-region update so VoiceOver isn't spammed mid-typing.
  useEffect(() => {
    if (!isOpen) {
      setAnnouncement('')
      return
    }
    const id = setTimeout(() => {
      setAnnouncement(
        totalCount === 0
          ? 'No results'
          : `${totalCount} ${totalCount === 1 ? 'result' : 'results'}`,
      )
    }, 300)
    return () => clearTimeout(id)
  }, [totalCount, isOpen, query])

  // VoiceOver does not reliably follow `autoFocus` into a freshly-mounted
  // modal — the virtual cursor stays on the trigger. Schedule the focus call
  // after RAC's FocusScope settles so VO registers the modal first, then
  // follows DOM focus into the input.
  useEffect(() => {
    if (!isOpen) return
    const id = setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true })
    }, 100)
    return () => clearTimeout(id)
  }, [isOpen])

  const selectedLabel = useMemo(() => {
    if (value == null) return null
    for (const g of groups) {
      const found = g.items.find((i) => i.id === value)
      if (found) return found.label
    }
    return null
  }, [groups, value])

  const handleQueryChange = (next: string) => {
    setQuery(next)
    onInputChange?.(next)
  }

  const handleSelect = (item: FlatItem) => {
    if (item.onAction) {
      item.onAction()
    } else {
      onChange?.(item.id)
    }
    setIsOpen(false)
    setQuery('')
    onInputChange?.('')
  }

  return (
    <AriaDialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <AriaButton className={classNames(styles.combobox)}>
        {selectedLabel ?? placeholder ?? ''}
      </AriaButton>
      <AriaModalOverlay className={styles.trayOverlay} isDismissable>
        <AriaModal className={styles.tray}>
          <AriaDialog className={styles.trayDialog}>
            <AriaHeading className={styles.trayHeading} slot='title'>
              {label}
            </AriaHeading>
            <div className={styles.inputWrapper}>
              <input
                aria-label={label}
                className={styles.input}
                onChange={(event) => handleQueryChange(event.target.value)}
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
                    handleQueryChange('')
                    inputRef.current?.focus()
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  type='button'
                >
                  <XmarkIcon />
                </button>
              )}
            </div>
            <div aria-live='polite' className={styles.visuallyHidden} role='status'>
              {announcement}
            </div>
            <div className={styles.listScroll}>
              {filteredGroups.map((group, index) => (
                <Group
                  key={group.title ?? `__ungrouped-${index}`}
                  group={group}
                  onSelect={handleSelect}
                  selectedId={value ?? null}
                />
              ))}
            </div>
            {bottomLink && (
              <AriaLink
                className={styles.bottomLink}
                href={bottomLink.href}
                onPress={() => setIsOpen(false)}
              >
                {bottomLink.label}
              </AriaLink>
            )}
          </AriaDialog>
        </AriaModal>
      </AriaModalOverlay>
    </AriaDialogTrigger>
  )
}

MobileCombobox.displayName = 'MobileCombobox'

const Group = ({
  group,
  onSelect,
  selectedId,
}: {
  group: ItemGroup
  onSelect: (item: FlatItem) => void
  selectedId: Key | null
}) => {
  const headingId = useId()
  const list = (
    <ul aria-labelledby={group.title ? headingId : undefined} className={styles.list}>
      {group.items.map((item) => {
        const isSelected = item.id === selectedId
        return (
          <li key={String(item.id)}>
            <button
              className={classNames(styles.itemButton, { [styles.isSelected]: isSelected })}
              onClick={() => onSelect(item)}
              type='button'
            >
              {item.label}
            </button>
          </li>
        )
      })}
    </ul>
  )

  if (!group.title) return list
  return (
    <>
      <h3 className={styles.sectionHeader} id={headingId}>
        {group.title}
      </h3>
      {list}
    </>
  )
}

// Walk Combobox children (ComboboxItem + ComboboxSection) and flatten them
// into groups the mobile tray can render as ul/li/button. Sections are matched
// via displayName to avoid a circular import on the desktop component.
function extractGroups(children: ReactNode): ItemGroup[] {
  const result: ItemGroup[] = []
  let standalone: FlatItem[] = []

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const componentName = (child.type as { displayName?: string })?.displayName

    if (componentName === 'ComboboxSection') {
      if (standalone.length > 0) {
        result.push({ items: standalone })
        standalone = []
      }
      const sectionProps = child.props as { title: string; children?: ReactNode }
      result.push({ title: sectionProps.title, items: extractItems(sectionProps.children) })
      return
    }

    const item = readItem(child)
    if (item) standalone.push(item)
  })

  if (standalone.length > 0) result.push({ items: standalone })
  return result
}

function extractItems(children: ReactNode): FlatItem[] {
  const items: FlatItem[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const item = readItem(child)
    if (item) items.push(item)
  })
  return items
}

function readItem(node: ReactElement): FlatItem | null {
  const props = node.props as {
    id?: Key
    children?: ReactNode
    textValue?: string
    onAction?: () => void
  }
  if (props.id == null) return null
  const label =
    typeof props.textValue === 'string'
      ? props.textValue
      : typeof props.children === 'string'
        ? props.children
        : ''
  return { id: props.id, label, onAction: props.onAction }
}
