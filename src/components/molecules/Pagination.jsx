import React from 'react';
import { ArrowLeft2, ArrowRight2 } from 'iconsax-react';

export const Pagination = ({ page, pageSize = 20, count = 0, onChange }) => {
  const totalPages = Math.ceil(count / pageSize);

  if (totalPages <= 0) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  const startRange = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRange = Math.min(page * pageSize, count);

  return (
    <div className="am-pagination">
      <div className="am-pagination-info">
        Affichage de {startRange} à {endRange} sur {count} élément{count > 1 ? 's' : ''}
      </div>
      
      {totalPages > 1 && (
        <div className="am-pagination-controls">
          <button
            className="am-pagination-btn"
            onClick={() => onChange(Math.max(1, page - 1))}
            disabled={page === 1}
            title="Page précédente"
          >
            <ArrowLeft2 size={16} variant="Linear" color="currentColor" />
          </button>
          
          {getPageNumbers().map((p, idx) => (
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="am-pagination-ellipsis">...</span>
            ) : (
              <button
                key={`page-${p}`}
                className={`am-pagination-btn ${page === p ? 'active' : ''}`}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            )
          ))}
          
          <button
            className="am-pagination-btn"
            onClick={() => onChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            title="Page suivante"
          >
            <ArrowRight2 size={16} variant="Linear" color="currentColor" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
