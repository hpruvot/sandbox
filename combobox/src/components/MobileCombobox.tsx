import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading as AriaHeading,
  type Key,
  Link as AriaLink,
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

import { XmarkIcon } from "./icons";
import styles from "./MobileCombobox.module.css";

export type MobileComboboxProps = {
  label: string;
  placeholder?: string;
  value?: Key | null;
  onChange?: (value: Key | null) => void;
  /** `ComboboxItem` / `ComboboxSection` children. */
  children: ReactNode;
  /** Optional link rendered below the list inside the tray. */
  bottomLink?: { label: string; href: string };
  /** Mirrors the desktop API — fired as the user types into the search input. */
  onInputChange?: (value: string) => void;
  /** When true, the trigger is unclickable and the tray cannot be opened. */
  isDisabled?: boolean;
  /**
   * Controlled input value. When provided, local client-side filtering is
   * skipped — the consumer is responsible for filtering children in response
   * to `onInputChange` (e.g. via `useAsyncList`).
   */
  inputValue?: string;
};

type FlatItem = { id: Key; label: string; onAction?: () => void };
type ItemGroup = { title?: string; items: FlatItem[] };

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
  isDisabled = false,
  inputValue: externalInputValue,
}: MobileComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { contains } = useFilter({ sensitivity: "base" });

  // When `inputValue` is provided externally, the consumer drives filtering
  // (e.g. async list). Skip local filtering and use the external value.
  const isExternallyFiltered = externalInputValue !== undefined;
  const effectiveQuery = externalInputValue ?? query;

  const groups = useMemo(() => extractGroups(children), [children]);
  const { onLoadMore, isLoading } = useMemo(
    () => extractLoadMore(children),
    [children],
  );

  const filteredGroups = useMemo<ItemGroup[]>(() => {
    if (isExternallyFiltered || !effectiveQuery.trim()) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => contains(i.label, effectiveQuery)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, effectiveQuery, contains, isExternallyFiltered]);

  const totalCount = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.items.length, 0),
    [filteredGroups],
  );

  // Debounce the live-region update so VoiceOver isn't spammed mid-typing.
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
  }, [totalCount, isOpen, effectiveQuery]);

  // IntersectionObserver on a sentinel at the bottom of the list — fires as
  // soon as the sentinel enters the scroll container's viewport, including on
  // first open when items don't yet fill the tray.
  useEffect(() => {
    if (!onLoadMore || !isOpen) return;
    const sentinel = sentinelRef.current;
    const root = listScrollRef.current;
    if (!sentinel || !root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { root, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, isOpen]);

  // `autoFocus` on the input handles the synchronous case (sighted users —
  // focus appears in the input as soon as the tray mounts). VoiceOver doesn't
  // follow that synthetic focus reliably though — its virtual cursor stays on
  // the trigger. Re-focus once the modal has settled so VO registers the
  // dialog context first, then follows DOM focus into the input.
  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(id);
  }, [isOpen]);

  const selectedLabel = useMemo(() => {
    if (value == null) return null;
    for (const g of groups) {
      const found = g.items.find((i) => i.id === value);
      if (found) return found.label;
    }
    return null;
  }, [groups, value]);

  const handleQueryChange = (next: string) => {
    if (!isExternallyFiltered) setQuery(next);
    onInputChange?.(next);
  };

  const handleSelect = (item: FlatItem) => {
    if (item.onAction) {
      item.onAction();
    } else {
      onChange?.(item.id);
    }
    setIsOpen(false);
    setQuery("");
    onInputChange?.("");
  };

  return (
    <AriaDialogTrigger isOpen={isOpen && !isDisabled} onOpenChange={setIsOpen}>
      <AriaButton
        aria-hidden={isDisabled ? true : undefined}
        className={classNames(styles.combobox, {
          [styles.isDisabled]: isDisabled,
        })}
        excludeFromTabOrder={isDisabled}
        isDisabled={isDisabled}
      >
        {selectedLabel ?? placeholder ?? ""}
      </AriaButton>
      <AriaModalOverlay className={styles.trayOverlay} isDismissable>
        <AriaModal className={styles.tray}>
          <AriaDialog className={styles.trayDialog}>
            <AriaHeading className={styles.trayHeading} slot="title">
              {label}
            </AriaHeading>
            <div className={styles.inputWrapper}>
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input
                aria-label={label}
                autoFocus
                className={styles.input}
                onChange={(event) => handleQueryChange(event.target.value)}
                ref={inputRef}
                role="searchbox"
                type="text"
                value={effectiveQuery}
                {...(placeholder !== undefined && { placeholder })}
              />
              {effectiveQuery.length > 0 && (
                <button
                  aria-label="Clear"
                  className={styles.clearButton}
                  onClick={() => {
                    handleQueryChange("");
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
            <div className={styles.listScroll} ref={listScrollRef}>
              {totalCount === 0 && !isLoading ? (
                <div className={styles.emptyState}>No results</div>
              ) : (
                filteredGroups.map((group, index) => (
                  <Group
                    key={group.title ?? `__ungrouped-${index}`}
                    group={group}
                    onSelect={handleSelect}
                    selectedId={value ?? null}
                  />
                ))
              )}
              {onLoadMore && <div aria-hidden="true" ref={sentinelRef} />}
              {isLoading && <div className={styles.loadingState}>Loading…</div>}
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
  );
};

MobileCombobox.displayName = "MobileCombobox";

const Group = ({
  group,
  onSelect,
  selectedId,
}: {
  group: ItemGroup;
  onSelect: (item: FlatItem) => void;
  selectedId: Key | null;
}) => {
  const headingId = useId();
  const list = (
    <ul
      aria-labelledby={group.title ? headingId : undefined}
      className={styles.list}
    >
      {group.items.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <li key={String(item.id)}>
            <button
              className={classNames(styles.itemButton, {
                [styles.isSelected]: isSelected,
              })}
              onClick={() => onSelect(item)}
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

type LoadMoreInfo = { onLoadMore?: () => void; isLoading?: boolean };

// Scan children for any element carrying onLoadMore prop — matches
// ListBoxLoadMoreItem regardless of its internal displayName.
function extractLoadMore(children: ReactNode): LoadMoreInfo {
  let result: LoadMoreInfo = {};
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const p = child.props as { onLoadMore?: () => void; isLoading?: boolean };
    if (typeof p.onLoadMore === "function") {
      result = { onLoadMore: p.onLoadMore, isLoading: p.isLoading };
    }
  });
  return result;
}

// Walk Combobox children (ComboboxItem + ComboboxSection) and flatten them
// into groups the mobile tray can render as ul/li/button. Sections are matched
// via displayName to avoid a circular import on the desktop component.
function extractGroups(children: ReactNode): ItemGroup[] {
  const result: ItemGroup[] = [];
  let standalone: FlatItem[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const componentName = (child.type as { displayName?: string })?.displayName;

    if (componentName === "ComboboxSection") {
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
    onAction?: () => void;
  };
  if (props.id == null) return null;
  const label =
    typeof props.textValue === "string"
      ? props.textValue
      : typeof props.children === "string"
        ? props.children
        : "";
  return { id: props.id, label, onAction: props.onAction };
}
