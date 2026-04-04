import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
};

function joinClassNames(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function getVariantClass(variant: ButtonVariant) {
  if (variant === 'secondary') {
    return styles.secondary;
  }

  if (variant === 'danger') {
    return styles.danger;
  }

  return styles.primary;
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & CommonProps;

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(styles.button, getVariantClass(variant), className)}
      {...props}
    />
  );
}

export type ButtonLinkProps = Omit<LinkProps, 'className'> & CommonProps;

export function ButtonLink({ variant = 'primary', className, ...props }: ButtonLinkProps) {
  return <Link className={joinClassNames(styles.button, getVariantClass(variant), className)} {...props} />;
}

export type ButtonAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & CommonProps;

export function ButtonAnchor({ variant = 'primary', className, ...props }: ButtonAnchorProps) {
  return <a className={joinClassNames(styles.button, getVariantClass(variant), className)} {...props} />;
}
