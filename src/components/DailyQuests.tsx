import React, { useState } from 'react';
import { FiCheckSquare, FiSquare, FiPlus, FiTrash2, FiAward } from 'react-icons/fi';

export interface Quest {
  id: string;
  text: string;
  completed: boolean;
  category: 'energy' | 'nutrition' | 'health' | 'balance';
}

interface DailyQuestsProps {
  quests: Quest[];
  onToggleQuest: (id: string) => void;
  onAddQuest: (text: string, category: Quest['category']) => void;
  onDeleteQuest: (id: string) => void;
}

export default function DailyQuests({
  quests,
  onToggleQuest,
  onAddQuest,
  onDeleteQuest
}: DailyQuestsProps) {
  const [newQuestText, setNewQuestText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const completedCount = quests.filter(q => q.completed).length;
  const totalCount = quests.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestText.trim()) return;
    onAddQuest(newQuestText.trim(), 'energy');
    setNewQuestText('');
    setShowAddForm(false);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '24px',
      padding: '20px',
      border: '1px solid var(--border-color)',
      boxShadow: '0 4px 20px rgba(10, 42, 30, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{
            fontSize: '17px',
            fontFamily: 'var(--font-serif)',
            margin: 0,
            color: 'var(--text-main)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <FiAward color="var(--accent-color)" /> Misiones del Día (Quests)
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
            {completedCount} de {totalCount} misiones completadas ({progressPercent}%)
          </span>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '6px 14px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FiPlus size={13} />
          <span>Nueva Misión</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '6px',
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${progressPercent}%`,
          background: 'linear-gradient(90deg, var(--accent-color), var(--accent-light))',
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <input
            type="text"
            placeholder="Escribe tu misión rápida..."
            value={newQuestText}
            onChange={e => setNewQuestText(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              background: 'var(--bg-app)',
              outline: 'none'
            }}
            autoFocus
          />
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'var(--text-main)',
              color: 'var(--bg-app)',
              border: 'none',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Agregar
          </button>
        </form>
      )}

      {/* Quest items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        {quests.map(quest => (
          <div
            key={quest.id}
            onClick={() => onToggleQuest(quest.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '14px',
              background: quest.completed ? 'rgba(16, 77, 48, 0.05)' : 'var(--bg-app)',
              border: quest.completed ? '1px solid rgba(16, 77, 48, 0.2)' : '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div style={{
                color: quest.completed ? 'var(--accent-green)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}>
                {quest.completed ? <FiCheckSquare size={18} /> : <FiSquare size={18} />}
              </div>

              <span style={{
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                color: quest.completed ? 'var(--text-muted)' : 'var(--text-main)',
                textDecoration: quest.completed ? 'line-through' : 'none',
                fontWeight: quest.completed ? 400 : 500
              }}>
                {quest.text}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteQuest(quest.id);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                opacity: 0.6
              }}
            >
              <FiTrash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
