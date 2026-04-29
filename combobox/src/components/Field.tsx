import classNames from 'classnames'
import type { ReactNode } from 'react'

import styles from './Field.module.css'

export type FieldState = 'default' | 'error'

export const getFieldLabelId = (id: string) => `${id}-label`
export const getFieldInputId = (id: string) => `${id}-input`
export const getFieldHintId = (id: string) => `${id}-hint`
export const getFieldMessageId = (id: string) => `${id}-message`

export const computeAriaDescribedBy = ({
  id,
  hint,
  message,
}: {
  id: string
  hint?: string
  message?: string
}) => {
  const ids: string[] = []
  if (hint) ids.push(getFieldHintId(id))
  if (message) ids.push(getFieldMessageId(id))
  return ids.length > 0 ? ids.join(' ') : undefined
}

type FieldProps = {
  id: string
  label: string
  hint?: string
  message?: string
  state?: FieldState
  isDisabled?: boolean
  isRequired?: boolean
  showRequirementLabel?: boolean
  children: ReactNode
}

/**
 * Minimal field chrome: label, optional hint, slot for the control, and
 * an optional message that turns red when `state === "error"`.
 */
export const Field = ({
  id,
  label,
  hint,
  message,
  state = 'default',
  isDisabled,
  isRequired,
  showRequirementLabel,
  children,
}: FieldProps) => {
  const isError = state === 'error'
  return (
    <div className={classNames(styles.field, { [styles.disabled]: isDisabled })}>
      <label className={styles.label} htmlFor={getFieldInputId(id)} id={getFieldLabelId(id)}>
        {label}
        {showRequirementLabel && (
          <span className={styles.requirement}>{isRequired ? ' *' : ' (optional)'}</span>
        )}
      </label>
      {hint && (
        <p className={styles.hint} id={getFieldHintId(id)}>
          {hint}
        </p>
      )}
      {children}
      {message && (
        <p
          className={classNames(styles.message, { [styles.messageError]: isError })}
          id={getFieldMessageId(id)}
        >
          {message}
        </p>
      )}
    </div>
  )
}
