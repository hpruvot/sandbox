import { useState } from "react";
import type { Key } from "react-aria-components";
import { ListBoxLoadMoreItem } from "react-aria-components";
import { useAsyncList } from "react-stately";

import { Combobox, ComboboxItem, ComboboxSection } from "./components/Combobox";
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
          </a>
          . Resize the window below 700px to switch to the mobile tray pattern.
        </p>
      </header>

      <section className={styles.demos}>
        <Demo title="1. Default — uncontrolled with default value">
          <Combobox
            defaultValue="kangaroo"
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
          <p className={styles.value}>
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
      </section>
    </main>
  );
};

const PAGE_SIZE = 50;

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
            return;
          }
          setSelected(key);
        }}
        onInputChange={setInputValue}
        placeholder="Type to filter or create…"
        value={selected}
      >
        {showCreate && (
          <ComboboxItem id={CREATE_ITEM_ID} textValue={trimmed}>
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
      <p className={styles.value}>
        Selected: <code>{selected == null ? "none" : String(selected)}</code>
      </p>
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
