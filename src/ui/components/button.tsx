import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
const buttonVariants = cva('button', { variants: { variant: { default: 'button-primary', outline: 'button-outline', ghost: 'button-ghost' }, size: { default: '', small: 'button-small' } }, defaultVariants: { variant: 'default', size: 'default' } });
export function Button({ className, variant, size, ...props }: ComponentProps<'button'> & VariantProps<typeof buttonVariants>) { return <button type="button" data-slot="button" className={clsx(buttonVariants({ variant, size }), className)} {...props} />; }
