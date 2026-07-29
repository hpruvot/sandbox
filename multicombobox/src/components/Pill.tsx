import { XmarkIcon } from './icons'
import styles from './Pill.module.css'

export type PillProps = {
  label: string
  onDelete: () => void
  deleteAriaLabel: string
}

/**
 * Raw removable tag. Deliberately a plain `<li><button>` pair, not part of
 * any `role=listbox`/`option` tree — a `<button>` inside `role=option` has no
 * reliable AT-exposed way to be reached or activated (see
 * `ListboxWithButtonsDemo` in the sibling `combobox/` POC). Keeping the pill
 * row as ordinary focusable DOM outside the listbox sidesteps that entirely:
 * Tab reaches it, Enter/Space activates it, no custom key handling needed.
 */
export const Pill = ({ label, onDelete, deleteAriaLabel }: PillProps) => (
  <li className={styles.pill}>
    <span className={styles.label}>{label}</span>
    <button
      aria-label={deleteAriaLabel}
      className={styles.deleteButton}
      onClick={onDelete}
      type='button'
    >
      <XmarkIcon />
    </button>
  </li>
)
