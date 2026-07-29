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

export const CircleCheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden='true'
    fill='currentColor'
    height='16'
    viewBox='0 0 16 16'
    width='16'
    {...props}
  >
    <path d='M7.695 9.969a.637.637 0 0 1-.914 0l-1.5-1.5a.637.637 0 0 1 0-.914.637.637 0 0 1 .914 0l1.055 1.03 2.531-2.53a.637.637 0 0 1 .914 0 .637.637 0 0 1 0 .914zM14 8c0 3.328-2.695 6-6 6-3.328 0-6-2.672-6-6 0-3.305 2.672-6 6-6 3.305 0 6 2.695 6 6M8 3.125C5.305 3.125 3.125 5.328 3.125 8A4.87 4.87 0 0 0 8 12.875c2.672 0 4.875-2.18 4.875-4.875 0-2.672-2.203-4.875-4.875-4.875' />
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
