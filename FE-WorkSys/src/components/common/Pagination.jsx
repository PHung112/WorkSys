import React from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-outline-variant/20 px-4 py-3 sm:px-6 mt-4">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="relative inline-flex items-center rounded-md border border-outline-variant/30 bg-surface px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className="relative ml-3 inline-flex items-center rounded-md border border-outline-variant/30 bg-surface px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-on-surface-variant">
            Showing page <span className="font-medium text-on-surface">{currentPage + 1}</span> of{' '}
            <span className="font-medium text-on-surface">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-on-surface-variant ring-1 ring-inset ring-outline-variant/30 hover:bg-surface-container-high focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-outline-variant/30 focus:z-20 focus:outline-offset-0 ${
                  currentPage === i
                    ? 'z-10 bg-primary text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                    : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-on-surface-variant ring-1 ring-inset ring-outline-variant/30 hover:bg-surface-container-high focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
