import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading as AriaHeading,
  type Key,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import classNames from "classnames";
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
} from "react";
import { useFilter } from "react-aria";

import { findOptionText } from "./MultiComboBox";
import { Pill } from "./Pill";
import { XmarkIcon } from "./icons";
import styles from "./MobileMultiComboBox.module.css";

export type MobileMultiComboBoxProps = {
  label: string;
  placeholder?: string;
  value?: Key[];
  defaultValue?: Key[];
  onChange?: (value: Key[]) => void;
  /** `MultiComboBoxItem` / `MultiComboBoxSection` children. */
  children: ReactNode;
  isDisabled?: boolean;
};

type FlatItem = { id: Key; label: string };
type ItemGroup = { title?: string; items: FlatItem[] };

/**
 * Mobile tray, multi-select variant. Same reasoning as the single-select
 * `MobileCombobox` for why this is `ul`/`li`/`button`, not
 * `role=listbox`/`option`: iOS VoiceOver / Android TalkBack don't reliably
 * bridge those roles inside a modal.
 *
 * On top of that, multi-select needs each row to convey a persistent
 * ON/OFF state rather than "activate and close" — `aria-pressed` on a real
 * `<button>` gives that natively (toggle button pattern), no `aria-selected`
 * gymnastics needed since these aren't listbox options. The tray stays open
 * across taps; closing is an explicit "Done" action, never implicit on
 * selection — implicit close after every tap would make picking N items
 * cost N re-opens.
 */
export const MobileMultiComboBox = ({
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  children,
  isDisabled = false,
}: MobileMultiComboBoxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { contains } = useFilter({ sensitivity: "base" });

  const isControlled = onChange !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<Key[]>(
    value ?? defaultValue ?? [],
  );
  const selectedKeys = isControlled ? (value ?? []) : uncontrolledValue;

  const groups = useMemo(() => extractGroups(children), [children]);

  const filteredGroups = useMemo<ItemGroup[]>(() => {
    if (!query.trim()) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => contains(i.label, query)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query, contains]);

  const totalCount = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.items.length, 0),
    [filteredGroups],
  );

  // Debounced so VoiceOver isn't spammed mid-typing — same reasoning as
  // the single-select MobileCombobox's filter announcement.
  useEffect(() => {
    if (!isOpen) {
      setAnnouncement("");
      return;
    }
    const id = setTimeout(() => {
      setAnnouncement(
        totalCount === 0
          ? "No results"
          : `${totalCount} ${totalCount === 1 ? "result" : "results"}`,
      );
    }, 300);
    return () => clearTimeout(id);
  }, [totalCount, isOpen, query]);

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(
      () => inputRef.current?.focus({ preventScroll: true }),
      100,
    );
    return () => clearTimeout(id);
  }, [isOpen]);

  const toggleItem = (item: FlatItem) => {
    const isSelected = selectedKeys.includes(item.id);
    const next = isSelected
      ? selectedKeys.filter((k) => k !== item.id)
      : [...selectedKeys, item.id];
    if (!isControlled) setUncontrolledValue(next);
    onChange?.(next);
    setAnnouncement(
      `${item.label} ${isSelected ? "removed" : "added"}. ${next.length} selected.`,
    );
  };

  const handlePillDelete = (key: Key) => {
    const text = findOptionText(children, key);
    const next = selectedKeys.filter((k) => k !== key);
    if (!isControlled) setUncontrolledValue(next);
    onChange?.(next);
    setAnnouncement(
      `Removed${text ? `: ${text}` : ""}. ${next.length} selected.`,
    );
    // Tray input when the pill lives inside the open tray; otherwise the
    // pill row below the closed trigger has no input to hand focus to.
    if (isOpen) inputRef.current?.focus();
    else triggerRef.current?.focus();
  };

  return (
    <AriaDialogTrigger isOpen={isOpen && !isDisabled} onOpenChange={setIsOpen}>
      <div className={styles.fieldGroup}>
        <AriaButton
          aria-hidden={isDisabled ? true : undefined}
          aria-label={`${label}${selectedKeys.length > 0 ? `: ${selectedKeys.length} selected` : ""}`}
          className={classNames(styles.combobox, {
            [styles.isDisabled]: isDisabled,
          })}
          excludeFromTabOrder={isDisabled}
          isDisabled={isDisabled}
          ref={triggerRef}
        >
          <span className={styles.placeholder}>{placeholder ?? ""}</span>
        </AriaButton>
        {/* Below the field, never inside it — pills embedded in the
            trigger were an explicitly rejected design (overlapping
            targets, reduced input target size). */}
        {selectedKeys.length > 0 && !isDisabled && (
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
      </div>
      <AriaModalOverlay className={styles.trayOverlay} isDismissable>
        <AriaModal className={styles.tray}>
          <AriaDialog className={styles.trayDialog}>
            <div className={styles.trayHeader}>
              <AriaHeading className={styles.trayHeading} slot="title">
                {label}
              </AriaHeading>
              <AriaButton
                className={styles.doneButton}
                onPress={() => setIsOpen(false)}
              >
                Done
              </AriaButton>
            </div>

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

            <div className={styles.inputWrapper}>
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input
                aria-label={`Filter ${label}`}
                autoFocus
                className={styles.input}
                onChange={(event) => setQuery(event.target.value)}
                ref={inputRef}
                role="searchbox"
                type="text"
                value={query}
                {...(placeholder !== undefined && { placeholder })}
              />
              {query.length > 0 && (
                <button
                  aria-label="Clear filter"
                  className={styles.clearButton}
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  type="button"
                >
                  <XmarkIcon />
                </button>
              )}
            </div>

            <div
              aria-live="polite"
              className={styles.visuallyHidden}
              role="status"
            >
              {announcement}
            </div>
            {/* In reading order — swiping from input to first row gives a
                reliable result count even when polite live regions get
                swallowed during the dialog-open transition. */}
            <p aria-atomic="true" className={styles.visuallyHidden}>
              {totalCount === 0
                ? "No results"
                : `${totalCount} ${totalCount === 1 ? "result" : "results"}`}
            </p>

            <div className={styles.listScroll}>
              {totalCount === 0 ? (
                <div className={styles.emptyState}>No results</div>
              ) : (
                filteredGroups.map((group, index) => (
                  <Group
                    key={group.title ?? `__ungrouped-${index}`}
                    group={group}
                    onToggle={toggleItem}
                    selectedKeys={selectedKeys}
                  />
                ))
              )}
            </div>
          </AriaDialog>
        </AriaModal>
      </AriaModalOverlay>
    </AriaDialogTrigger>
  );
};

MobileMultiComboBox.displayName = "MobileMultiComboBox";

const Group = ({
  group,
  onToggle,
  selectedKeys,
}: {
  group: ItemGroup;
  onToggle: (item: FlatItem) => void;
  selectedKeys: Key[];
}) => {
  const headingId = useId();
  const list = (
    <ul
      aria-labelledby={group.title ? headingId : undefined}
      className={styles.list}
    >
      {group.items.map((item) => {
        const isSelected = selectedKeys.includes(item.id);
        return (
          <li key={String(item.id)}>
            <button
              aria-pressed={isSelected}
              className={classNames(styles.itemButton, {
                [styles.isSelected]: isSelected,
              })}
              onClick={() => onToggle(item)}
              type="button"
            >
              {item.label}
            </button>
          </li>
        );
      })}
    </ul>
  );

  if (!group.title) return list;
  return (
    <>
      <h3 className={styles.sectionHeader} id={headingId}>
        {group.title}
      </h3>
      {list}
    </>
  );
};

function extractGroups(children: ReactNode): ItemGroup[] {
  const result: ItemGroup[] = [];
  let standalone: FlatItem[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const componentName = (child.type as { displayName?: string })?.displayName;

    if (componentName === "MultiComboBoxSection") {
      if (standalone.length > 0) {
        result.push({ items: standalone });
        standalone = [];
      }
      const sectionProps = child.props as {
        title: string;
        children?: ReactNode;
      };
      result.push({
        title: sectionProps.title,
        items: extractItems(sectionProps.children),
      });
      return;
    }

    const item = readItem(child);
    if (item) standalone.push(item);
  });

  if (standalone.length > 0) result.push({ items: standalone });
  return result;
}

function extractItems(children: ReactNode): FlatItem[] {
  const items: FlatItem[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const item = readItem(child);
    if (item) items.push(item);
  });
  return items;
}

function readItem(node: ReactElement): FlatItem | null {
  const props = node.props as {
    id?: Key;
    children?: ReactNode;
    textValue?: string;
  };
  if (props.id == null) return null;
  const label =
    typeof props.textValue === "string"
      ? props.textValue
      : typeof props.children === "string"
        ? props.children
        : "";
  return { id: props.id, label };
}
