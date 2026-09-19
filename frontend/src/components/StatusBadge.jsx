import React from 'react';

const STATUS_LABELS = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  accepted: 'Accepted by Kitchen',
  preparing: 'Cooking / Preparing',
  ready_to_serve: 'Ready to Serve',
  served: 'Served to Table',
  paid: 'Settled & Paid',
};

export function StatusBadge({ status }) {
  const normalized = status ? status.toLowerCase() : 'placed';
  const label = STATUS_LABELS[normalized] || normalized;

  return (
    <span className={`status-badge status-${normalized}`}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}
