import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './input.module.scss';

function joinClassNames(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return <input ref={ref} className={joinClassNames(styles.input, className)} {...props} />;
});

Input.displayName = 'Input';
