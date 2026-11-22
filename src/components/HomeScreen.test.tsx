import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomeScreen } from './HomeScreen';

const noop = vi.fn();

describe('HomeScreen', () => {
  it('يُعرض بدون أخطاء وبدون أي ذكر للطوارئ', () => {
    const { container } = render(
      <HomeScreen
        district="المنصورة"
        user={{ name: 'عميل', phone: '01000000000', defaultDistrict: 'المنصورة' }}
        locations={[]}
        technicians={[]}
        reviews={[]}
        quotes={[]}
        requests={[]}
        onSelectDistrict={noop}
        onSelectCategory={noop}
        onRequestService={noop}
        onViewTechnicianStats={noop}
        onOpenAllServices={noop}
        onOpenSmartPlanner={noop}
      />
    );
    expect(screen.getByText('عروض وباقات')).toBeTruthy();
    expect(screen.getByText('كل الخدمات')).toBeTruthy();
    expect(container.textContent).not.toMatch(/طوارئ|طارئ/);
  });
});
