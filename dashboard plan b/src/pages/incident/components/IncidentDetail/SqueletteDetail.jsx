import React from 'react';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText, ShimmerCircularImage } from 'react-shimmer-effects';

// Composant shimmer pour le détail d'incident
export const IncidentDetailSkeleton = () => (
  <section className="project-detail" style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', padding: '0' }}>
    {/* Header */}
    <div className="detail-header" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
      <div className="detail-title-block">
        <div className="detail-back-btn-skeleton" style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden' }}>
          <ShimmerThumbnail height={40} width={40} rounded />
        </div>
        <div className="detail-title-skeleton" style={{ flex: 1, marginLeft: '12px', maxWidth: '300px' }}>
          <ShimmerTitle line={1} gap={0} variant="primary" />
        </div>
        <div className="detail-badges-skeleton" style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
          <div style={{ width: '80px', height: '24px', borderRadius: '20px', overflow: 'hidden' }}>
            <ShimmerThumbnail height={24} width={80} rounded />
          </div>
          <div style={{ width: '60px', height: '24px', borderRadius: '20px', overflow: 'hidden' }}>
            <ShimmerThumbnail height={24} width={60} rounded />
          </div>
        </div>
        <div className="detail-action-btn-skeleton" style={{ marginLeft: 'auto', width: '180px', height: '38px', borderRadius: '8px', overflow: 'hidden' }}>
          <ShimmerThumbnail height={38} width={180} rounded />
        </div>
      </div>

      {/* Meta info list shimmer */}
      <div className="detail-meta" style={{ marginTop: '8px', display: 'flex', gap: '16px' }}>
        <div style={{ width: '150px', height: '16px', borderRadius: '4px', overflow: 'hidden' }}>
          <ShimmerThumbnail height={16} width={150} rounded />
        </div>
        <div style={{ width: '120px', height: '16px', borderRadius: '4px', overflow: 'hidden' }}>
          <ShimmerThumbnail height={16} width={120} rounded />
        </div>
      </div>
    </div>

    <div className="incident-dark-dashboard">
      {/* ── Colonne gauche ── */}
      <div className="dashboard-col-left">
        {/* Photo Card Shimmer */}
        <div className="dark-card" style={{ marginBottom: '20px', padding: '16px' }}>
          <div style={{ width: '180px', height: '16px', marginBottom: '16px', overflow: 'hidden' }}>
            <ShimmerTitle line={1} gap={0} />
          </div>
          <div style={{ width: '100%', height: '260px', borderRadius: '8px', overflow: 'hidden' }}>
            <ShimmerThumbnail height={260} rounded />
          </div>
        </div>

        {/* Audio Card Shimmer */}
        <div className="dark-card" style={{ marginBottom: '20px', padding: '16px' }}>
          <div style={{ width: '150px', height: '16px', marginBottom: '16px', overflow: 'hidden' }}>
            <ShimmerTitle line={1} gap={0} />
          </div>
          <div style={{ width: '100%', height: '54px', borderRadius: '8px', overflow: 'hidden' }}>
            <ShimmerThumbnail height={54} rounded />
          </div>
        </div>

        {/* GPS Card Shimmer */}
        <div className="dark-card" style={{ marginBottom: '20px', padding: '16px' }}>
          <div style={{ width: '160px', height: '16px', marginBottom: '16px', overflow: 'hidden' }}>
            <ShimmerTitle line={1} gap={0} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div style={{ height: '38px', borderRadius: '6px', overflow: 'hidden' }}>
              <ShimmerThumbnail height={38} rounded />
            </div>
            <div style={{ height: '38px', borderRadius: '6px', overflow: 'hidden' }}>
              <ShimmerThumbnail height={38} rounded />
            </div>
          </div>
          <div style={{ width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden' }}>
            <ShimmerThumbnail height={180} rounded />
          </div>
        </div>
      </div>

      {/* ── Colonne droite ── */}
      <div className="dashboard-col-right">
        {/* KPIs row shimmer */}
        <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div className="kpi-card" style={{ padding: '16px', height: '120px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ShimmerCircularImage size={32} />
            <ShimmerText line={1} gap={0} />
            <ShimmerText line={1} gap={0} />
          </div>
          <div className="kpi-card" style={{ padding: '16px', height: '120px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ShimmerCircularImage size={32} />
            <ShimmerText line={1} gap={0} />
            <ShimmerText line={1} gap={0} />
          </div>
          <div className="kpi-card" style={{ padding: '16px', height: '120px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ShimmerCircularImage size={32} />
            <ShimmerText line={1} gap={0} />
            <ShimmerText line={1} gap={0} />
          </div>
        </div>

        {/* IA vision analysis card shimmer */}
        <div className="dark-card" style={{ marginBottom: '20px', padding: '16px' }}>
          <div style={{ width: '200px', height: '18px', marginBottom: '16px', overflow: 'hidden' }}>
            <ShimmerTitle line={1} gap={0} />
          </div>
          <div style={{ width: '120px', height: '24px', borderRadius: '20px', marginBottom: '16px', overflow: 'hidden' }}>
            <ShimmerThumbnail height={24} width={120} rounded />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ShimmerText line={4} gap={10} />
          </div>
        </div>

        {/* 3 Pillars shimmer */}
        <div className="pillars-grid" style={{ marginBottom: '20px' }}>
          <div className="dark-card" style={{ padding: '16px', height: '220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ShimmerTitle line={1} gap={0} />
            <ShimmerText line={3} gap={10} />
          </div>
          <div className="dark-card" style={{ padding: '16px', height: '220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ShimmerTitle line={1} gap={0} />
            <ShimmerText line={3} gap={10} />
          </div>
          <div className="dark-card" style={{ padding: '16px', height: '220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ShimmerTitle line={1} gap={0} />
            <ShimmerText line={3} gap={10} />
          </div>
        </div>
      </div>
    </div>
  </section>
);

