import { useState } from 'react';
import {
  ShoppingCart,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { GroceryProvider, useGrocery } from '../context/GroceryContext';
import { useApp } from '../context/AppContext';
import { runAiPrompt, parseAiJsonArray } from '../services/aiService';
import GroceryHeader from '../components/grocery/GroceryHeader';
import GroceryQuickAdd from '../components/grocery/GroceryQuickAdd';
import GroceryCategoryFilter from '../components/grocery/GroceryCategoryFilter';
import GroceryItemCard from '../components/grocery/GroceryItemCard';
import GroceryEditModal from '../components/grocery/GroceryEditModal';
import GroceryListModal from '../components/grocery/GroceryListModal';
import Modal from '../components/ui/Modal';
import type { GroceryItem, GroceryList, GroceryCategory, GroceryUnit } from '../types/grocery';

const VALID_GROCERY_CATEGORIES: GroceryCategory[] = [
  'fruits',
  'vegetables',
  'dairy',
  'meat-seafood',
  'snacks',
  'beverages',
  'bakery',
  'grains-staples',
  'household',
  'personal-care',
  'other',
];

const VALID_GROCERY_UNITS: GroceryUnit[] = [
  'kg',
  'g',
  'litre',
  'ml',
  'pcs',
  'packs',
  'bottles',
  'cans',
  'box',
  'bunch',
];

function GroceryContent() {
  const {
    activeList,
    filteredPendingItems,
    filteredPurchasedItems,
    activeListItems,
    createList,
    renameList,
    addItem,
    updateItem,
    deleteItem,
  } = useGrocery();
  const { settings } = useApp();

  // AI Quick List state
  const [aiListPrompt, setAiListPrompt] = useState('');
  const [aiListLoading, setAiListLoading] = useState(false);
  const [aiListStatus, setAiListStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleGenerateAiGroceryList = async (e: React.FormEvent) => {
    e.preventDefault();
    const goal = aiListPrompt.trim();
    if (!goal || aiListLoading) return;
    setAiListLoading(true);
    setAiListStatus(null);
    const res = await runAiPrompt(
      `Generate a grocery shopping list for: "${goal}".\nReturn ONLY a raw JSON array of 4 to 10 items. Each item object must have:\n{"name": "Item Name", "quantity": 1, "unit": "kg|g|litre|ml|pcs|packs|bottles|cans|box|bunch", "category": "fruits|vegetables|dairy|meat-seafood|snacks|beverages|bakery|grains-staples|household|personal-care|other"}\nNo markdown or extra prose.`,
      'You are a smart kitchen & grocery planner. Output strictly valid JSON arrays.',
      {
        provider: settings.aiSettings?.provider || 'gemini',
        model: settings.aiSettings?.model,
      }
    );
    setAiListLoading(false);

    if (!res.success || !res.text) {
      setAiListStatus({ type: 'error', text: res.error || 'Failed to generate grocery list.' });
      return;
    }

    const parsed = parseAiJsonArray<{
      name?: string;
      quantity?: number;
      unit?: string;
      category?: string;
    }>(res.text);
    if (!parsed || parsed.length === 0) {
      setAiListStatus({ type: 'error', text: 'AI response could not be parsed into grocery items.' });
      return;
    }

    let addedCount = 0;
    for (const raw of parsed.slice(0, 12)) {
      const name = String(raw.name || '').trim();
      if (!name) continue;
      const cat = VALID_GROCERY_CATEGORIES.includes(raw.category as GroceryCategory)
        ? (raw.category as GroceryCategory)
        : 'other';
      const unit = VALID_GROCERY_UNITS.includes(raw.unit as GroceryUnit)
        ? (raw.unit as GroceryUnit)
        : 'pcs';
      const qty = typeof raw.quantity === 'number' && raw.quantity > 0 ? raw.quantity : 1;
      addItem({
        name,
        quantity: qty,
        unit,
        category: cat,
      });
      addedCount++;
    }

    if (addedCount > 0) {
      setAiListPrompt('');
      setAiListStatus({ type: 'success', text: `Added ${addedCount} AI-generated items to "${activeList?.name || 'Active List'}".` });
    } else {
      setAiListStatus({ type: 'error', text: 'No valid grocery items generated.' });
    }
  };

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
          overscrollBehavior: 'contain',
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

        {/* AI Quick List Generator */}
        <form
          onSubmit={handleGenerateAiGroceryList}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(139, 92, 246, 0.08))',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          <Sparkles size={16} color="#34d399" style={{ flexShrink: 0 }} />
          <input
            type="text"
            className="input"
            value={aiListPrompt}
            onChange={(e) => setAiListPrompt(e.target.value)}
            placeholder='AI Quick List: e.g. "South Indian breakfast for 4" or "Weekly high-protein prep"'
            style={{ flex: 1, minWidth: '220px', fontSize: '0.84rem', height: '36px' }}
          />
          <button
            type="submit"
            disabled={aiListLoading || !aiListPrompt.trim()}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
          >
            <Sparkles size={13} className={aiListLoading ? 'animate-spin' : ''} />
            <span>{aiListLoading ? 'Generating…' : 'AI Quick List'}</span>
          </button>
          {aiListStatus && (
            <div style={{ width: '100%', fontSize: '0.78rem', color: aiListStatus.type === 'error' ? '#f87171' : '#34d399', marginTop: '2px' }}>
              {aiListStatus.text}
            </div>
          )}
        </form>

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
            background: 'var(--bg-surface)',
            border: '1px dashed rgba(16, 185, 129, 0.4)',
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
            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Your shopping list is empty
            </h3>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '340px' }}>
              Add groceries above or type an item like &quot;Tomatoes 1 kg&quot; to begin shopping.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Pending / To Buy Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '4px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
