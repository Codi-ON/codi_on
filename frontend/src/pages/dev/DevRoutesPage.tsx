import React from 'react';
import { Link } from 'react-router-dom';

type RouteItem = { path: string; label: string; note?: string };

const ROUTES: RouteItem[] = [
  { path: '/', label: 'Landing' },

  // 사용자
  { path: '/user/history', label: 'User / History' },

  // 관리자
  { path: '/admin/dashboard', label: 'Admin / Dashboard' },

  // 기능 페이지(너 프로젝트에 실제 있는 라우트로만 남겨)
  { path: '/closet', label: 'Closet' },
  { path: '/recommendation', label: 'Recommendation' },
];

export default function DevRoutesPage() {
  return (
    <div style={{ padding: 24, maxWidth: 840, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 8 }}>DEV ROUTES</h2>
      <p style={{ marginTop: 0, color: '#666' }}>
        mock 데이터 렌더링 검증용. PR 전 제거하거나 env 가드 처리 권장.
      </p>

      <ul style={{ display: 'grid', gap: 12, padding: 0, listStyle: 'none' }}>
        {ROUTES.map((r) => (
          <li
            key={r.path}
            style={{
              border: '1px solid #ddd',
              borderRadius: 10,
              padding: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{r.path}</div>
              {r.note ? <div style={{ fontSize: 12, color: '#999' }}>{r.note}</div> : null}
            </div>
            <Link to={r.path}>이동</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}