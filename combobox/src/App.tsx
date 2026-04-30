import { useState } from 'react'
import type { Key } from 'react-aria-components'

import { Combobox, ComboboxItem, ComboboxSection } from './components/Combobox'
import { animals, fruitsBySection, longOptions } from './components/data'
import styles from './App.module.css'

export const App = () => {
  const [animal, setAnimal] = useState<Key | null>('panda')
  const [fruit, setFruit] = useState<Key | null>(null)

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Combobox POC</h1>
        <p className={styles.subtitle}>
          Accessible combobox built on{' '}
          <a href='https://react-spectrum.adobe.com/react-aria/ComboBox.html'>
            react-aria-components
          </a>
          . Resize the window below 700px to switch to the mobile tray pattern.
        </p>
      </header>

      <section className={styles.demos}>
        <Demo title='1. Default — uncontrolled with default value'>
          <Combobox
            defaultValue='panda'
            label='Favorite animal'
            placeholder='Select an animal'
          >
            {animals.map((a) => (
              <ComboboxItem key={a.id} id={a.id}>
                {a.name}
              </ComboboxItem>
            ))}
          </Combobox>
        </Demo>

        <Demo title='2. Controlled selection'>
          <Combobox
            label='Favorite animal (controlled)'
            onChange={setAnimal}
            placeholder='Select an animal'
            value={animal}
          >
            {animals.map((a) => (
              <ComboboxItem key={a.id} id={a.id}>
                {a.name}
              </ComboboxItem>
            ))}
          </Combobox>
          <p className={styles.value}>
            Selected: <code>{animal == null ? 'none' : String(animal)}</code>
          </p>
        </Demo>

        <Demo title='3. Hint, required marker, and error state'>
          <Combobox
            hint='Pick the animal you would adopt today.'
            isRequired
            label='Required animal'
            message='Please select one.'
            placeholder='Select an animal'
            showRequirementLabel
            state='error'
          >
            {animals.map((a) => (
              <ComboboxItem key={a.id} id={a.id}>
                {a.name}
              </ComboboxItem>
            ))}
          </Combobox>
        </Demo>

        <Demo title='4. Sections'>
          <Combobox
            label='Favorite fruit'
            onChange={setFruit}
            placeholder='Select a fruit'
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

        <Demo title='5. Bottom link (secondary action inside the popover)'>
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
        </Demo>

        <Demo title='6. Long list (1500 options) — verifies virtualization-free perf'>
          <Combobox label='Pick an option' placeholder='Type to filter…'>
            {longOptions.map((o) => (
              <ComboboxItem key={o.id} id={o.id}>
                {o.name}
              </ComboboxItem>
            ))}
          </Combobox>
        </Demo>

        <Demo title='7. Disabled'>
          <Combobox isDisabled label='Disabled animal' placeholder='Select an animal'>
            {animals.map((a) => (
              <ComboboxItem key={a.id} id={a.id}>
                {a.name}
              </ComboboxItem>
            ))}
          </Combobox>
        </Demo>

        <Demo title='8. Item actions — create from typed value'>
          <ItemActionsDemo />
        </Demo>
      </section>
    </main>
  )
}

const ItemActionsDemo = () => {
  const [inputValue, setInputValue] = useState('')
  const [created, setCreated] = useState<string[]>([])
  const [selected, setSelected] = useState<Key | null>(null)

  // Show the create option as a regular item — selecting it both creates and
  // selects in one click, no separate "now click the new entry" step.
  const trimmed = inputValue.trim()
  const showCreate = trimmed.length > 0 && !created.includes(trimmed)

  return (
    <>
      <Combobox
        allowsEmptyCollection
        inputValue={inputValue}
        label='Favorite animal'
        onChange={(key) => {
          if (typeof key === 'string' && key === trimmed && !created.includes(key)) {
            setCreated((c) => [...c, key])
          }
          setSelected(key)
        }}
        onInputChange={setInputValue}
        placeholder='Type to filter or create…'
        value={selected}
      >
        {showCreate && (
          <ComboboxItem id={trimmed} textValue={trimmed}>
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
        Selected: <code>{selected == null ? 'none' : String(selected)}</code>
      </p>
    </>
  )
}

const Demo = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <article className={styles.demo}>
    <h2 className={styles.demoTitle}>{title}</h2>
    <div className={styles.demoBody}>{children}</div>
  </article>
)
