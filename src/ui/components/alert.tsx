import type { ComponentProps } from 'react';
import { clsx } from 'clsx';
export function Alert({ className, ...props }: ComponentProps<'div'>) { return <div role="alert" data-slot="alert" className={clsx('alert', className)} {...props} />; }
