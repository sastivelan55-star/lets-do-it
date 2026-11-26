import { Search, X } from 'lucide-react';
import { useGrocery } from '../../context/GroceryContext';
import { GROCERY_CATEGORIES } from '../../types/grocery';

export default function GroceryCategoryFilter() {
  const {
    activeListItems,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
  } = useGrocery();

  // Compute item counts per category in active list
  const categoryCounts: Record<string, number> = { all: activeListItems.length };
  for (const item of activeListItems) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        marginBottom: '1.25rem',
      }}
    >
      <style>{`
        .grocery-cat-scroll::-webkit-scrollbar {
          display: none;
          height: 0px;
        }
      `}</style>

      {/* Top Search Filter */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '0.4rem 0.85rem',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Search size={15} color="#10b981" style={{ marginRight: '0.5rem', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Filter groceries by item name or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.84rem',
            fontFamily: 'inherit',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.45)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category Horizontal Chips */}
      <div
        className="grocery-cat-scroll"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* All Button */}
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '999px',
            background:
              selectedCategory === 'all'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.25))'
                : 'var(--bg-surface)',
            border:
              selectedCategory === 'all'
                ? '1px solid rgba(16, 185, 129, 0.65)'
                : '1px solid var(--border)',
            color: selectedCategory === 'all' ? '#10b981' : 'var(--text-primary)',
            fontSize: '0.78rem',
            fontWeight: selectedCategory === 'all' ? 700 : 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            boxShadow: selectedCategory === 'all' ? '0 0 12px rgba(16, 185, 129, 0.3)' : 'none',
          }}
        >
          <span>🛒 All</span>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '0.08rem 0.4rem',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.12)',
              marginLeft: '0.15rem',
            }}
          >
            {categoryCounts.all || 0}
          </span>
        </button>

        {/* Categories */}
        {GROCERY_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                background: isSelected
                  ? `linear-gradient(135deg, ${cat.color}25, rgba(16, 185, 129, 0.18))`
                  : 'var(--bg-surface)',
                border: isSelected
                  ? `1px solid ${cat.color}`
                  : '1px solid var(--border)',
                color: isSelected ? cat.color : 'var(--text-primary)',
                fontSize: '0.78rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? `0 0 12px ${cat.color}40` : 'none',
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {count > 0 && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '0.08rem 0.4rem',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.12)',
                    marginLeft: '0.15rem',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
