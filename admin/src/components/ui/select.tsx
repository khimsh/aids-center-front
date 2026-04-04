import { forwardRef, type SelectHTMLAttributes } from 'react';
import styles from './select.module.scss';

function joinClassNames(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => {
  return <select ref={ref} className={joinClassNames(styles.select, className)} {...props} />;
});

Select.displayName = 'Select';
