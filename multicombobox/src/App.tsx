import { useState } from "react";
import type { Key } from "react-aria-components";

import { animals, fruitsBySection } from "./components/data";
import {
  MultiComboBox,
  MultiComboBoxItem,
  MultiComboBoxSection,
} from "./components/MultiComboBox";
import styles from "./App.module.css";

export const App = () => {
  const [animalKeys, setAnimalKeys] = useState<Key[]>(["kangaroo"]);
  const [fruitKeys, setFruitKeys] = useState<Key[]>([]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>MultiComboBox POC</h1>
        <p className={styles.subtitle}>
          Multi-select combobox built on{" "}
          <a href="https://react-aria.adobe.com/ComboBox.html">
            react-aria-components
          </a>{" "}
          (<code>selectionMode=&quot;multiple&quot;</code>). Resize below 700px
          to switch to the mobile tray pattern. No design-system components —
          raw semantics only.
        </p>
      </header>

      <section className={styles.demos}>
        <Demo title="1. Uncontrolled — default selection">
          <MultiComboBox
            label="Favorite animals"
            placeholder="Select animals"
            defaultValue={[]}
          >
            {animals.map((a) => (
              <MultiComboBoxItem key={a.id} id={a.id}>
                {a.name}
              </MultiComboBoxItem>
            ))}
          </MultiComboBox>
        </Demo>

        <Demo title="2. Controlled selection">
          <MultiComboBox
            label="Favorite animals (controlled)"
            onChange={setAnimalKeys}
            placeholder="Select animals"
            value={animalKeys}
          >
            {animals.map((a) => (
              <MultiComboBoxItem key={a.id} id={a.id}>
                {a.name}
              </MultiComboBoxItem>
            ))}
          </MultiComboBox>
          <p aria-hidden="true" className={styles.value}>
            Selected:{" "}
            <code>
              {animalKeys.length === 0 ? "none" : animalKeys.join(", ")}
            </code>
          </p>
        </Demo>

        <Demo title="3. Hint, required marker, and error state">
          <MultiComboBox
            hint="Pick every animal you would adopt today."
            isRequired
            label="Required animals"
            message="Please select at least one."
            placeholder="Select animals"
            showRequirementLabel
            state="error"
          >
            {animals.map((a) => (
              <MultiComboBoxItem key={a.id} id={a.id}>
                {a.name}
              </MultiComboBoxItem>
            ))}
          </MultiComboBox>
        </Demo>

        <Demo title="4. Sections">
          <MultiComboBox
            label="Favorite fruits"
            onChange={setFruitKeys}
            placeholder="Select fruits"
            value={fruitKeys}
          >
            {fruitsBySection.map((section) => (
              <MultiComboBoxSection key={section.title} title={section.title}>
                {section.items.map((item) => (
                  <MultiComboBoxItem key={item.id} id={item.id}>
                    {item.name}
                  </MultiComboBoxItem>
                ))}
              </MultiComboBoxSection>
            ))}
          </MultiComboBox>
        </Demo>

        <Demo title="5. Disabled">
          <MultiComboBox
            isDisabled
            label="Disabled animals"
            placeholder="Select animals"
          >
            {animals.map((a) => (
              <MultiComboBoxItem key={a.id} id={a.id}>
                {a.name}
              </MultiComboBoxItem>
            ))}
          </MultiComboBox>
        </Demo>
      </section>
    </main>
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
