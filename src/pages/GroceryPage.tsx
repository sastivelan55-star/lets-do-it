import { useState } from 'react';
import {
  ShoppingCart,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { GroceryProvider, useGrocery } from '../context/GroceryContext';
import GroceryHeader from '../components/grocery/GroceryHeader';
import GroceryQuickAdd from '../components/grocery/GroceryQuickAdd';
import GroceryCategoryFilter from '../components/grocery/GroceryCategoryFilter';
import GroceryItemCard from '../components/grocery/GroceryItemCard';
import GroceryEditModal from '../components/grocery/GroceryEditModal';
import GroceryListModal from '../components/grocery/GroceryListModal';
import Modal from '../components/ui/Modal';
import type { GroceryItem, GroceryList } from '../types/grocery';

function GroceryContent() {
  const {
    activeList,
    filteredPendingItems,
    filteredPurchasedItems,
    activeListItems,
    createList,
    renameList,
    updateItem,
    deleteItem,
  } = useGrocery();

  // Modals state
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<GroceryItem | null>(null);
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [renamingList, setRenamingList] = useState<GroceryList | null>(null);
  const [showPurchasedSection, setShowPurchasedSection] = useState(true);

  const handleConfirmDelete = () => {
    if (deletingItem) {
      deleteItem(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const hasAnyItemsInActiveList = activeListItems.length > 0;

  return (
    <div
      className="composite-page"
      style={{
        maxWidth: '100vw',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Top Header */}
      <header
        className="composite-header"
        style={{
          padding: '1.1rem clamp(0.75rem, 2vw, 1.5rem) 0.65rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="composite-title" style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981' }}>🛒</span>
              <span>Grocery List</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                {activeList?.name || 'Smart Shopping'}
              </span>
            </h1>
            <p className="composite-subtitle" style={{ margin: '0.15rem 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
              Smart grocery checklists, pantry tracking, multiple lists & estimated budgets
            </p>
          </div>
        </div>
      </header>

      {/* Scrollable Content Container */}
      <div
        className="composite-content"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 'clamp(0.75rem, 2vw, 1.5rem)',
          paddingBottom: '6rem',
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Lists Switcher, Metrics & Shopping Progress Header */}
        <GroceryHeader
          onOpenCreateListModal={() => setIsCreateListModalOpen(true)}
          onOpenRenameListModal={() => setRenamingList(activeList || null)}
        />

        {/* Quick Add Bar */}
        <GroceryQuickAdd />

        {/* Category Filter & Search Chips */}
        <GroceryCategoryFilter />

      {/* Shopping Checklist Area */}
      {!hasAnyItemsInActiveList ? (
        <div
          style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px dashed rgba(16, 185, 129, 0.3)',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
            }}
          >
            <ShoppingCart size={28} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              Your shopping list is empty
            </h3>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8', maxWidth: '340px' }}>
              Add groceries above or type an item like &quot;Tomatoes 1 kg&quot; to begin shopping.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Pending / To Buy Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '4px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#fbbf24' }}>●</span> To Buy ({filteredPendingItems.length})
              </span>
            </div>

            {filteredPendingItems.length === 0 ? (
              <div
                style={{
                  padding: '1.5rem 1rem',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  color: '#94a3b8',
                  fontSize: '0.82rem',
                }}
              >
                No unpurchased items matching the current filter.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredPendingItems.map((item) => (
                  <GroceryItemCard
                    key={item.id}
                    item={item}
                    onEdit={(it) => setEditingItem(it)}
                    onDelete={(it) => setDeletingItem(it)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Purchased Section (Collapsible) */}
          {filteredPurchasedItems.length > 0 && (
            <div
              style={{
                marginTop: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => setShowPurchasedSection((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  padding: '0.35rem 0.5rem',
                  color: '#34d399',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} />
                  <span>Purchased Items ({filteredPurchasedItems.length})</span>
                </span>
                {showPurchasedSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showPurchasedSection && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredPurchasedItems.map((item) => (
                    <GroceryItemCard
                      key={item.id}
                      item={item}
                      onEdit={(it) => setEditingItem(it)}
                      onDelete={(it) => setDeletingItem(it)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Edit Item Modal */}
      <GroceryEditModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onSave={(id, updates) => updateItem(id, updates)}
      />

      {/* Create / Rename Shopping List Modal */}
      <GroceryListModal
        isOpen={isCreateListModalOpen || Boolean(renamingList)}
        onClose={() => {
          setIsCreateListModalOpen(false);
          setRenamingList(null);
        }}
        listToRename={renamingList}
        onSave={(name, color) => {
          if (renamingList) {
            renameList(renamingList.id, name);
          } else {
            createList(name, color);
          }
        }}
      />

      {/* Delete Item Confirmation Modal */}
      {deletingItem && (
        <Modal
          isOpen={Boolean(deletingItem)}
          onClose={() => setDeletingItem(null)}
          title="Delete Grocery Item"
          maxWidth="420px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div>
                <p style={{ margin: '0 0 0.35rem', fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                  Delete &quot;{deletingItem.name}&quot;?
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                  This will remove this item from your shopping list.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingItem(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function GroceryPage() {
  return (
    <GroceryProvider>
      <GroceryContent />
    </GroceryProvider>
  );
}
