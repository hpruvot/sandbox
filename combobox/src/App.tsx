import { useCallback, useId, useRef, useState } from "react";
import type { Key } from "react-aria-components";
import { ListBoxLoadMoreItem } from "react-aria-components";
import { useAsyncList } from "react-stately";
import { Controller, useForm } from "react-hook-form";
import MaterialModal from "@mui/material/Modal";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";

import { Combobox, ComboboxItem, ComboboxSection } from "./components/Combobox";
import { CircleCheckIcon, XmarkIcon } from "./components/icons";
import { animals, fruitsBySection, longOptions } from "./components/data";
import styles from "./App.module.css";

export const App = () => {
  const [animal, setAnimal] = useState<Key | null>("panda");
  const [fruit, setFruit] = useState<Key | null>(null);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Combobox POC</h1>
        <p className={styles.subtitle}>
          Accessible combobox built on{" "}
          <a href="https://react-spectrum.adobe.com/react-aria/ComboBox.html">
            react-aria-components
          </a>{" "}
          . Resize the window below 700px to switch to the mobile tray pattern.
        </p>
      </header>

      <section className={styles.demos}>
        <Demo title="1. Default — uncontrolled with default value">
          <Combobox
            value="kangaroo"
            label="Favorite animal"
            placeholder="Select an animal"
          >
            {animals.map((a) => (
              <ComboboxItem key={a.id} id={a.id}>
                {a.name}
              </ComboboxItem>
            ))}
          </Combobox>
        </Demo>

        <Demo title="2. Controlled selection">
          <Combobox
            label="Favorite animal (controlled)"
            onChange={setAnimal}
            placeholder="Select an animal"
            value={animal}
          >
            {animals.map((a) => (
              <ComboboxItem key={a.id} id={a.id}>
                {a.name}
              </ComboboxItem>
            ))}
          </Combobox>
          <p aria-hidden="true" className={styles.value}>
            Selected: <code>{animal == null ? "none" : String(animal)}</code>
          </p>
        </Demo>

        <Demo title="3. Hint, required marker, and error state">
          <Combobox
            hint="Pick the animal you would adopt today."
            isRequired
            label="Required animal"
            message="Please select one."
            placeholder="Select an animal"
            showRequirementLabel
            state="error"
          >
            {animals.map((a) => (
              <ComboboxItem key={a.id} id={a.id}>
                {a.name}
              </ComboboxItem>
            ))}
          </Combobox>
        </Demo>

        <Demo title="4. Sections">
          <Combobox
            label="Favorite fruit"
            onChange={setFruit}
            placeholder="Select a fruit"
            value={fruit}
          >
            {fruitsBySection.map((section) => (
              <ComboboxSection key={section.title} title={section.title}>
                {section.items.map((item) => (
                  <ComboboxItem key={item.id} id={item.id}>
                    {item.name}
                  </ComboboxItem>
                ))}
              </ComboboxSection>
            ))}
          </Combobox>
        </Demo>

        {/* <Demo title='5. Bottom link (secondary action inside the popover)'>
          <Combobox
            bottomLink={{ label: 'Add a new animal…', href: '#new-animal' }}
            label='Animal with secondary action'
            placeholder='Select an animal'
          >
            {animals.map((a) => (
              <ComboboxItem key={a.id} id={a.id}>
                {a.name}
              </ComboboxItem>
            ))}
          </Combobox>
        </Demo> */}

        <Demo title="5. Long list (1500 options) — async loading">
          <AsyncLongListDemo />
        </Demo>

        <Demo title="6. Disabled">
          <Combobox
            isDisabled
            label="Disabled animal"
            placeholder="Select an animal"
          >
            {animals.map((a) => (
              <ComboboxItem key={a.id} id={a.id}>
                {a.name}
              </ComboboxItem>
            ))}
          </Combobox>
        </Demo>

        <Demo title="7. Item actions — create from typed value">
          <ItemActionsDemo />
        </Demo>

        <Demo title="8. React Hook Form">
          <ReactHookFormDemo />
        </Demo>

        <Demo title="9. US.8 — Listbox with remove buttons (⚠️ a11y: button inside role=option is invalid)">
          <ListboxWithButtonsDemo />
        </Demo>

        <Demo title="10. US.8 — Grid alternative (role=grid, semantically valid)">
          <GridComboboxDemo />
        </Demo>

        <Demo title="11. Combobox inside an MUI Modal (test mobile tray behavior)">
          <ModalComboboxDemo />
        </Demo>

        <Demo title="12. Combobox inside an MUI SwipeableDrawer (bottom sheet)">
          <SwipeableDrawerComboboxDemo />
        </Demo>
      </section>
    </main>
  );
};

const PAGE_SIZE = 10;

const AsyncLongListDemo = () => {
  const list = useAsyncList<(typeof longOptions)[number], number>({
    async load({ cursor, filterText }) {
      const filtered = filterText
        ? longOptions.filter((o) =>
            o.name.toLowerCase().includes(filterText.toLowerCase()),
          )
        : longOptions;
      const offset = cursor ?? 0;
      const items = filtered.slice(offset, offset + PAGE_SIZE);
      const nextCursor =
        offset + PAGE_SIZE < filtered.length ? offset + PAGE_SIZE : undefined;
      return { items, cursor: nextCursor };
    },
    initialFilterText: "",
  });

  return (
    <Combobox
      allowsEmptyCollection
      defaultFilter={() => true}
      inputValue={list.filterText}
      label="Pick an option"
      onInputChange={list.setFilterText}
      placeholder="Type to filter…"
    >
      {list.items.map((o) => (
        <ComboboxItem key={o.id} id={o.id}>
          {o.name}
        </ComboboxItem>
      ))}
      <ListBoxLoadMoreItem
        isLoading={list.isLoading}
        onLoadMore={list.loadMore}
      >
        Loading more…
      </ListBoxLoadMoreItem>
    </Combobox>
  );
};

const CREATE_ITEM_ID = "__create__";

const ItemActionsDemo = () => {
  const [inputValue, setInputValue] = useState("");
  const [created, setCreated] = useState<string[]>([]);
  const [selected, setSelected] = useState<Key | null>(null);

  // Stable id for the create entry — RAC throws "Cannot change the id of an
  // item" if we use the typed value as the id (it changes on every keystroke).
  // We resolve the typed value back inside onChange.
  const trimmed = inputValue.trim();
  const isExisting =
    animals.some((a) => a.id === trimmed) || created.includes(trimmed);
  const showCreate = trimmed.length > 0 && !isExisting;

  return (
    <>
      <Combobox
        allowsEmptyCollection
        inputValue={inputValue}
        label="Favorite animal"
        onChange={(key) => {
          if (key === CREATE_ITEM_ID) {
            setCreated((c) => (c.includes(trimmed) ? c : [...c, trimmed]));
            setSelected(trimmed);
            setInputValue(trimmed);
            return;
          }
          setSelected(key);
          const label =
            animals.find((a) => a.id === key)?.name ?? String(key ?? "");
          setInputValue(label);
        }}
        onInputChange={setInputValue}
        placeholder="Type to filter or create…"
        value={selected}
      >
        {showCreate && (
          <ComboboxItem id={CREATE_ITEM_ID} textValue={`Create "${trimmed}"`}>
            {`Create "${trimmed}"`}
          </ComboboxItem>
        )}
        {animals.map((a) => (
          <ComboboxItem key={a.id} id={a.id}>
            {a.name}
          </ComboboxItem>
        ))}
        {created.map((name) => (
          <ComboboxItem key={name} id={name}>
            {name}
          </ComboboxItem>
        ))}
      </Combobox>
      <p aria-hidden="true" className={styles.value}>
        Selected: <code>{selected == null ? "none" : String(selected)}</code>
      </p>
    </>
  );
};

type FormValues = {
  animal: Key | null;
  fruit: Key | null;
};

const ReactHookFormDemo = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: { animal: null, fruit: null },
  });

  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  return (
    <form
      onSubmit={handleSubmit((data) => setSubmitted(data))}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <Controller
        control={control}
        name="fruit"
        render={({ field }) => (
          <Combobox
            label="Favorite fruit (optional)"
            placeholder="Select a fruit"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
          >
            {fruitsBySection.map((section) => (
              <ComboboxSection key={section.title} title={section.title}>
                {section.items.map((item) => (
                  <ComboboxItem key={item.id} id={item.id}>
                    {item.name}
                  </ComboboxItem>
                ))}
              </ComboboxSection>
            ))}
          </Combobox>
        )}
      />
      <Controller
        control={control}
        name="animal"
        rules={{ required: "Please select an animal." }}
        render={({ field, fieldState }) => (
          <Combobox
            label="Favorite animal"
            placeholder="Select an animal"
            isRequired
            showRequirementLabel
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            state={fieldState.error ? "error" : undefined}
            message={fieldState.error?.message}
          >
            {animals.map((a) => (
              <ComboboxItem key={a.id} id={a.id}>
                {a.name}
              </ComboboxItem>
            ))}
          </Combobox>
        )}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit">Submit</button>
        <button
          type="button"
          onClick={() => {
            reset();
            setSubmitted(null);
          }}
        >
          Reset
        </button>
      </div>
      {submitted && (
        <p aria-hidden="true" className={styles.value}>
          Submitted: <code>{JSON.stringify(submitted)}</code>
        </p>
      )}
      {errors.animal && !submitted && (
        <p aria-hidden="true" className={styles.value}>
          Form has errors — fix them and resubmit.
        </p>
      )}
    </form>
  );
};

// ---------------------------------------------------------------------------
// Demo 9 — Listbox with remove buttons
// ⚠️ Semantically invalid: <button> inside role="option" is not allowed per
// ARIA. Screen readers see the option text but can't reach/activate the button.
// Works visually and with a mouse, but fails keyboard-only and SR workflows.
// ---------------------------------------------------------------------------
const ListboxWithButtonsDemo = () => {
  const [items, setItems] = useState(animals);
  const [selected, setSelected] = useState<Key | null>(null);

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
    if (selected === id) setSelected(null);
  };

  return (
    <>
      <Combobox
        allowsEmptyCollection
        label="Posology"
        onChange={setSelected}
        placeholder="Select one"
        value={selected}
      >
        {items.map((a) => (
          <ComboboxItem key={a.id} id={a.id} textValue={a.name}>
            {a.name}
            <button
              aria-label={`Remove ${a.name}`}
              className={styles.removeButton}
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(a.id);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
              }}
              type="button"
            >
              <XmarkIcon />
            </button>
          </ComboboxItem>
        ))}
      </Combobox>
      <p aria-hidden="true" className={styles.value}>
        Selected: <code>{selected == null ? "none" : String(selected)}</code>
        {" · "}{items.length} items remaining
      </p>
    </>
  );
};

// ---------------------------------------------------------------------------
// Demo 10 — Grid-based combobox (custom, no RAC ComboBox)
// Uses role="grid" with role="row" / role="gridcell" so each row can contain
// a label cell (for selection) and an action cell (remove button).
// Keyboard: ↑↓ moves between rows, Enter selects, Tab moves to the action
// button within the row, Escape closes. Filtering via the input.
// ---------------------------------------------------------------------------
const GridComboboxDemo = () => {
  const [items, setItems] = useState(animals);
  const [selected, setSelected] = useState<Key | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [focusedCol, setFocusedCol] = useState<0 | 1>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const gridId = `${id}-grid`;

  const filtered = items.filter((a) =>
    a.name.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const selectedLabel = items.find((a) => a.id === selected)?.name ?? "";

  const openMenu = useCallback(() => {
    setIsOpen(true);
    setFocusedIndex(0);
    setFocusedCol(0);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    setFocusedCol(0);
  }, []);

  const selectItem = useCallback(
    (key: Key) => {
      const label = items.find((a) => a.id === key)?.name ?? "";
      setSelected(key);
      setInputValue(label);
      closeMenu();
      inputRef.current?.focus();
    },
    [items, closeMenu],
  );

  const removeItem = useCallback(
    (itemId: string) => {
      setItems((prev) => prev.filter((a) => a.id !== itemId));
      if (selected === itemId) {
        setSelected(null);
        setInputValue("");
      }
    },
    [selected],
  );

  const focusRemoveButton = useCallback(
    (rowIndex: number) => {
      const item = filtered[rowIndex];
      if (!item || !gridRef.current) return;
      const btn = gridRef.current.querySelector<HTMLButtonElement>(
        `#${CSS.escape(`${id}-row-${item.id}`)} button`,
      );
      btn?.focus();
    },
    [filtered, id],
  );

  const returnToInput = useCallback(() => {
    setFocusedCol(0);
    inputRef.current?.focus();
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) openMenu();
        else setFocusedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case "ArrowRight":
        if (isOpen && focusedIndex >= 0) {
          e.preventDefault();
          setFocusedCol(1);
          focusRemoveButton(focusedIndex);
        }
        break;
      case "Enter":
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && filtered[focusedIndex]) {
          selectItem(filtered[focusedIndex].id);
        }
        break;
      case "Escape":
        if (isOpen) {
          e.preventDefault();
          closeMenu();
          setInputValue(selectedLabel);
        }
        break;
    }
  };

  const handleGridButtonKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        returnToInput();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (rowIndex < filtered.length - 1) {
          setFocusedIndex(rowIndex + 1);
          focusRemoveButton(rowIndex + 1);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (rowIndex > 0) {
          setFocusedIndex(rowIndex - 1);
          focusRemoveButton(rowIndex - 1);
        } else {
          returnToInput();
        }
        break;
      case "Escape":
        e.preventDefault();
        closeMenu();
        setInputValue(selectedLabel);
        inputRef.current?.focus();
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!isOpen) openMenu();
    setFocusedIndex(0);
    setFocusedCol(0);
  };

  const focusedId =
    isOpen && focusedIndex >= 0 && focusedCol === 0 && filtered[focusedIndex]
      ? `${id}-row-${filtered[focusedIndex].id}`
      : undefined;

  return (
    <>
      <div style={{ position: "relative" }}>
        <label
          htmlFor={`${id}-input`}
          style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 4 }}
        >
          Posology (grid)
        </label>
        <div className={styles.gridInputWrapper}>
          <input
            aria-activedescendant={focusedId}
            aria-autocomplete="list"
            aria-controls={isOpen ? gridId : undefined}
            aria-expanded={isOpen}
            className={styles.gridInput}
            id={`${id}-input`}
            onChange={handleInputChange}
            onClick={() => !isOpen && openMenu()}
            onFocus={() => !isOpen && openMenu()}
            onBlur={(e) => {
              // Don't close if clicking inside the grid
              if (gridRef.current?.contains(e.relatedTarget)) return;
              closeMenu();
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Select one"
            ref={inputRef}
            role="combobox"
            type="text"
            value={inputValue}
          />
        </div>
        {isOpen && (
          <div
            className={styles.gridPopover}
            id={gridId}
            onMouseDown={(e) => e.preventDefault()}
            ref={gridRef}
            role="grid"
            aria-label="Posology options"
          >
            {filtered.length === 0 ? (
              <div className={styles.gridEmpty}>No results</div>
            ) : (
              filtered.map((a, index) => {
                const isFocused = index === focusedIndex;
                const isItemSelected = a.id === selected;
                return (
                  <div
                    aria-selected={isItemSelected || undefined}
                    className={`${styles.gridRow} ${isFocused ? styles.gridRowFocused : ""}`}
                    id={`${id}-row-${a.id}`}
                    key={a.id}
                    role="row"
                  >
                    <div
                      className={styles.gridCell}
                      onClick={() => selectItem(a.id)}
                      role="gridcell"
                    >
                      <span className={styles.gridCellLabel}>
                        {a.name}
                      </span>
                      {isItemSelected && (
                        <CircleCheckIcon style={{ color: "#2563eb", flexShrink: 0 }} />
                      )}
                    </div>
                    <div className={styles.gridCellAction} role="gridcell">
                      <button
                        aria-label={`Remove ${a.name}`}
                        className={styles.gridRemoveButton}
                        onClick={() => {
                          removeItem(a.id);
                          returnToInput();
                        }}
                        onKeyDown={(e) => handleGridButtonKeyDown(e, index)}
                        tabIndex={isFocused && focusedCol === 1 ? 0 : -1}
                        type="button"
                      >
                        <XmarkIcon />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      <p aria-hidden="true" className={styles.value}>
        Selected: <code>{selected == null ? "none" : String(selected)}</code>
        {" · "}{items.length} items remaining
      </p>
    </>
  );
};

// ---------------------------------------------------------------------------
// Demo 11 — Combobox inside an MUI Modal (mirrors oxygen Modal usage)
// On mobile (<700px), the Combobox swaps to MobileCombobox which renders its
// own react-aria ModalOverlay tray. That tray is portaled into <body>, so it
// sits *next to* the MUI Modal in the DOM rather than inside it — focus
// trapping, scroll-lock, and stacking can all collide. This demo is the place
// to reproduce and probe those issues.
// ---------------------------------------------------------------------------
const ModalComboboxDemo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [animal, setAnimal] = useState<Key | null>(null);
  const [fruit, setFruit] = useState<Key | null>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={styles.modalTrigger}
      >
        Open modal with combobox
      </button>

      <MaterialModal
        aria-labelledby={titleId}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className={styles.muiModal}
      >
        <div className={styles.modalContent}>
          <header className={styles.modalHeader}>
            <h2 id={titleId} className={styles.modalTitle}>
              Pick something
            </h2>
            <button
              type="button"
              aria-label="Close"
              className={styles.modalClose}
              onClick={() => setIsOpen(false)}
            >
              <XmarkIcon />
            </button>
          </header>

          <div className={styles.modalBody}>
            <p className={styles.modalIntro}>
              Resize below 700px to switch the comboboxes to the mobile tray and
              see how they interact with the MUI Modal (focus, scroll-lock,
              stacking).
            </p>
            <Combobox
              label="Favorite animal"
              placeholder="Select an animal"
              value={animal}
              onChange={setAnimal}
            >
              {animals.map((a) => (
                <ComboboxItem key={a.id} id={a.id}>
                  {a.name}
                </ComboboxItem>
              ))}
            </Combobox>
            <Combobox
              label="Favorite fruit"
              placeholder="Select a fruit"
              value={fruit}
              onChange={setFruit}
            >
              {fruitsBySection.map((section) => (
                <ComboboxSection key={section.title} title={section.title}>
                  {section.items.map((item) => (
                    <ComboboxItem key={item.id} id={item.id}>
                      {item.name}
                    </ComboboxItem>
                  ))}
                </ComboboxSection>
              ))}
            </Combobox>
            <Combobox
              label="Pick from a long list"
              placeholder="Type to filter…"
            >
              {longOptions.slice(0, 50).map((o) => (
                <ComboboxItem key={o.id} id={o.id}>
                  {o.name}
                </ComboboxItem>
              ))}
            </Combobox>
          </div>

          <footer className={styles.modalFooter}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={styles.modalSecondary}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={styles.modalPrimary}
            >
              Confirm
            </button>
          </footer>
        </div>
      </MaterialModal>
    </>
  );
};

// ---------------------------------------------------------------------------
// Demo 12 — Combobox inside an MUI SwipeableDrawer (bottom sheet)
// SwipeableDrawer is the typical mobile bottom-sheet container. The mobile
// Combobox tray is itself a portaled ModalOverlay, so opening it from inside
// a SwipeableDrawer stacks two body-portals on top of each other — same
// focus/scroll questions as Demo 11, plus the swipe gesture.
// ---------------------------------------------------------------------------
const SwipeableDrawerComboboxDemo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [animal, setAnimal] = useState<Key | null>(null);
  const [fruit, setFruit] = useState<Key | null>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={styles.modalTrigger}
      >
        Open swipeable drawer
      </button>

      <SwipeableDrawer
        anchor="bottom"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onOpen={() => setIsOpen(true)}
        disableSwipeToOpen
        slotProps={{
          root: { "aria-labelledby": titleId },
          paper: { className: styles.drawerPaper },
        }}
      >
        <div className={styles.drawerHandleRow}>
          <div aria-hidden="true" className={styles.drawerHandle} />
        </div>
        <header className={styles.drawerHeader}>
          <h2 id={titleId} className={styles.modalTitle}>
            Pick something
          </h2>
          <button
            type="button"
            aria-label="Close"
            className={styles.modalClose}
            onClick={() => setIsOpen(false)}
          >
            <XmarkIcon />
          </button>
        </header>

        <div className={styles.drawerBody}>
          <p className={styles.modalIntro}>
            Same content as Demo 11 but inside a SwipeableDrawer (bottom
            sheet). Try opening a combobox on mobile to see how the tray
            stacks with the drawer.
          </p>
          <Combobox
            label="Favorite animal"
            placeholder="Select an animal"
            value={animal}
            onChange={setAnimal}
          >
            {animals.map((a) => (
              <ComboboxItem key={a.id} id={a.id}>
                {a.name}
              </ComboboxItem>
            ))}
          </Combobox>
          <Combobox
            label="Favorite fruit"
            placeholder="Select a fruit"
            value={fruit}
            onChange={setFruit}
          >
            {fruitsBySection.map((section) => (
              <ComboboxSection key={section.title} title={section.title}>
                {section.items.map((item) => (
                  <ComboboxItem key={item.id} id={item.id}>
                    {item.name}
                  </ComboboxItem>
                ))}
              </ComboboxSection>
            ))}
          </Combobox>
          <Combobox label="Pick from a long list" placeholder="Type to filter…">
            {longOptions.slice(0, 50).map((o) => (
              <ComboboxItem key={o.id} id={o.id}>
                {o.name}
              </ComboboxItem>
            ))}
          </Combobox>
        </div>

        <footer className={styles.modalFooter}>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className={styles.modalSecondary}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className={styles.modalPrimary}
          >
            Confirm
          </button>
        </footer>
      </SwipeableDrawer>
    </>
  );
};

const Demo = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <article className={styles.demo}>
    <h2 className={styles.demoTitle}>{title}</h2>
    <div className={styles.demoBody}>{children}</div>
  </article>
);
