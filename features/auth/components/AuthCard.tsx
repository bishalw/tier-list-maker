import React from 'react';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-surface border border-border-main rounded-panel shadow-panel overflow-hidden">
        <div className="p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-text-main tracking-tight mb-2 uppercase italic">
              {title}
            </h1>
            <p className="text-text-muted">
              {subtitle}
            </p>
          </div>

          {children}
        </div>

        {footer && (
          <div className="px-8 py-4 bg-bg-main/50 border-t border-border-main text-center">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
