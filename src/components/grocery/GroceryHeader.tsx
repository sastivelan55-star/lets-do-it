import {
  ShoppingCart,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { useGrocery } from '../../context/GroceryContext';

interface GroceryHeaderProps {
  onOpenCreateListModal: () => void;
  onOpenRenameListModal: () => void;
}

export default function GroceryHeader({
  onOpenCreateListModal,
  onOpenRenameListModal,
}: GroceryHeaderProps) {
  const {
    lists,
    activeListId,
    activeList,
    setActiveListId,
    deleteList,
    progress,
    clearPurchasedInActiveList,
    cloudSyncStatus,
    syncNow,
    syncNotice,
    clearSyncNotice,
  } = useGrocery();

  const handleDeleteCurrentList = () => {
    if (lists.length <= 1) {
      alert('You cannot delete your only shopping list.');
      return;
    }
    if (confirm(`Delete shopping list "${activeList?.name}" and all its items?`)) {
      if (activeList) deleteList(activeList.id);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(16, 26, 36, 0.75) 0%, rgba(10, 16, 24, 0.7) 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(16, 185, 129, 0.22)',
        padding: '1.25rem 1.4rem',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        marginBottom: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Top Row: List Selector Tabs & List Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        {/* List Switcher Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none',
          }}
        >
          {lists.map((list) => {
            const isActive = list.id === activeListId;
            return (
              <button
                key={list.id}
                onClick={() => setActiveListId(list.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.42rem 0.85rem',
                  borderRadius: '12px',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.28), rgba(5, 150, 105, 0.22))'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isActive
                    ? '1px solid rgba(52, 211, 153, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#ffffff' : 'rgba(226, 232, 240, 0.75)',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none',
                }}
              >
                <ShoppingCart size={13} color={isActive ? '#34d399' : '#94a3b8'} />
                <span>{list.name}</span>
              </button>
            );
          })}

          <button
            onClick={onOpenCreateListModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.42rem 0.8rem',
              borderRadius: '12px',
              background: 'transparent',
              border: '1px dashed rgba(52, 211, 153, 0.4)',
              color: '#34d399',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={13} />
            <span>New List</span>
          </button>
        </div>

        {/* List Action Buttons (Cloud Sync, Rename, Delete, Clear Purchased) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {/* Automatic Cloud Sync Status Button */}
          <button
            type="button"
            onClick={syncNow}
            title={
              cloudSyncStatus === 'synced'
                ? 'Cloud Sync Active — Web & Mobile synced'
                : cloudSyncStatus === 'syncing'
                ? 'Syncing with Supabase Cloud...'
                : 'Click to sync grocery data'
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.65rem',
              minWidth: '114px',
              height: '32px',
              borderRadius: '9px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              boxSizing: 'border-box',
              transition: 'background 0.2s ease, border-color 0.2s ease',
            }}
          >
            <RefreshCw size={12} className={cloudSyncStatus === 'syncing' ? 'animate-spin' : ''} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap' }}>
              {cloudSyncStatus === 'synced'
                ? 'Cloud Synced'
                : cloudSyncStatus === 'syncing'
                ? 'Syncing...'
                : 'Sync Cloud'}
            </span>
          </button>

          <button
            onClick={onOpenRenameListModal}
            title="Rename current list"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.65rem',
              borderRadius: '9px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Edit2 size={12} color="#34d399" />
            <span>Rename</span>
          </button>

          {lists.length > 1 && (
            <button
              onClick={handleDeleteCurrentList}
              title="Delete current list"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.65rem',
                borderRadius: '9px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={12} />
              <span>Delete List</span>
            </button>
          )}

          {progress.purchased > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all purchased items in this list?')) {
                  clearPurchasedInActiveList();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.65rem',
                borderRadius: '9px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <CheckCircle2 size={12} />
              <span>Clear Purchased ({progress.purchased})</span>
            </button>
          )}
        </div>
      </div>

      {/* Shopping Progress Bar */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.45rem',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc', fontWeight: 700 }}>
            <span style={{ color: '#34d399' }}>●</span>
            <span>Shopping Progress</span>
            <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.76rem' }}>
              ({progress.purchased} of {progress.total} items purchased)
            </span>
          </div>
          <span style={{ color: '#34d399', fontWeight: 800 }}>{progress.percentage}%</span>
        </div>

        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress.percentage}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #34d399, #06b6d4)',
              borderRadius: '999px',
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
            }}
          />
        </div>
      </div>

      {/* Metrics Row: Total, Purchased, Remaining, Total Estimated Cost */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          marginTop: '0.25rem',
        }}
      >
        <div
          style={{
            padding: '0.75rem 0.9rem',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Total Items</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
            {progress.total}
          </span>
        </div>

        <div
          style={{
            padding: '0.75rem 0.9rem',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>Purchased</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
            {progress.purchased}
          </span>
        </div>

        <div
          style={{
            padding: '0.75rem 0.9rem',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600 }}>Remaining</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
            {progress.remaining}
          </span>
        </div>

        <div
          style={{
            padding: '0.75rem 0.9rem',
            borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <DollarSign size={12} /> Estimated Cost
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
            {progress.totalEstimatedCost > 0 ? `₹${progress.totalEstimatedCost}` : '—'}
          </span>
        </div>
      </div>

      {/* Sync Notice Banner */}
      {syncNotice && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 0.9rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            fontSize: '0.8rem',
            color: '#34d399',
            marginTop: '0.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span>{syncNotice}</span>
          </div>
          <button
            type="button"
            onClick={clearSyncNotice}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              fontSize: '0.9rem',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
