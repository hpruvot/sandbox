import type { SVGProps } from 'react'

export const ChevronDownIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden='true'
    fill='none'
    height='16'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2'
    viewBox='0 0 24 24'
    width='16'
    {...props}
  >
    <polyline points='6 9 12 15 18 9' />
  </svg>
)

export const XmarkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden='true'
    fill='none'
    height='14'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2.5'
    viewBox='0 0 24 24'
    width='14'
    {...props}
  >
    <line x1='18' x2='6' y1='6' y2='18' />
    <line x1='6' x2='18' y1='6' y2='18' />
  </svg>
)
