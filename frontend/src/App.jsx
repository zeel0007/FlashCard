import React, { useState, useEffect } from 'react';
import Flashcard from './components/Flashcard';
import CodeViewer from './components/CodeViewer';
import { tufProblems } from './tufData';

const API_URL = import.meta.env.PROD ? '/api/cards' : 'http://localhost:5001/api/cards';

function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation: 'dashboard' | 'revise' | 'add' | 'list' | 'tuf'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Revision State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentIndex, setCurrentIndex] = useState(0);

  // TUF A2Z Sheet States
  const [expandedTufStep, setExpandedTufStep] = useState("Step 1: Learn the Basics"); // Default first open
  const [expandedTufTitle, setExpandedTufTitle] = useState(null);
  const [completedTuf, setCompletedTuf] = useState(() => {
    try {
      const saved = localStorage.getItem('tuf-completed');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  
  // Form State (for adding/editing a card)
  const [editingCardId, setEditingCardId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description: '',
    code: '',
    timeComplexity: '',
    spaceComplexity: ''
  });

  // Fetch all cards from MongoDB
  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch flashcards from backend');
      }
      const data = await response.json();
      setCards(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to MongoDB server. Running in offline UI mode.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // Save TUF completed checklist to localStorage
  useEffect(() => {
    localStorage.setItem('tuf-completed', JSON.stringify(completedTuf));
  }, [completedTuf]);

  // Update card status in database
  const updateCardStatus = async (cardId, newStatus) => {
    try {
      // Optimistic update in frontend state
      setCards(prevCards => 
        prevCards.map(c => c._id === cardId ? { ...c, status: newStatus, lastRevised: new Date() } : c)
      );

      const response = await fetch(`${API_URL}/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status on server');
      }
    } catch (err) {
      console.error('Error updating card status:', err);
    }
    
    // Auto-advance to next card after status update in revision mode
    setTimeout(() => {
      handleNextCard();
    }, 100);
  };

  // Create a new card in database
  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.code) {
      alert('Please fill out Title and Code Snippet!');
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create card');
      }
      
      const newCard = await response.json();
      setCards([newCard, ...cards]);
      
      // Reset form
      setFormData({
        title: '',
        category: 'Arrays & Hashmaps',
        difficulty: 'Medium',
        description: '',
        code: '',
        timeComplexity: '',
        spaceComplexity: ''
      });
      
      alert('Java Flashcard Added Successfully!');
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Error adding card:', err);
      alert('Failed to save card. Check if backend is running.');
    }
  };

  // Import TUF problem directly to active study deck
  const handleImportTufCard = async (prob) => {
    const isAlreadyImported = cards.some(c => c.title.toLowerCase() === prob.title.toLowerCase());
    if (isAlreadyImported) {
      alert('This problem is already in your revision deck!');
      return;
    }

    const cardData = {
      title: prob.title,
      category: prob.category,
      difficulty: prob.difficulty,
      description: prob.description,
      code: prob.code,
      timeComplexity: prob.timeComplexity,
      spaceComplexity: prob.spaceComplexity,
      status: 'learning'
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to import card');
      }
      
      const newCard = await response.json();
      setCards([newCard, ...cards]);
      alert(`"${prob.title}" has been successfully imported to your Java study deck!`);
    } catch (err) {
      console.error('Error importing TUF card:', err);
      alert('Could not import card. Check if database is connected.');
    }
  };

  // Toggle checklist status for TUF SDE Sheet
  const toggleTufChecklist = (title) => {
    setCompletedTuf(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Edit card handler
  const handleEditCardSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/${editingCardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update card');
      }
      
      const updatedCard = await response.json();
      setCards(prevCards => prevCards.map(c => c._id === editingCardId ? updatedCard : c));
      setEditingCardId(null);
      setFormData({
        title: '',
        category: 'Arrays & Hashmaps',
        difficulty: 'Medium',
        description: '',
        code: '',
        timeComplexity: '',
        spaceComplexity: ''
      });
      alert('Card updated successfully!');
      setActiveTab('list');
    } catch (err) {
      console.error('Error updating card:', err);
      alert('Failed to update card.');
    }
  };

  // Delete card handler
  const handleDeleteCard = async (cardId) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    try {
      const response = await fetch(`${API_URL}/${cardId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete card');
      }
      setCards(prevCards => prevCards.filter(c => c._id !== cardId));
    } catch (err) {
      console.error('Error deleting card:', err);
      alert('Could not delete card.');
    }
  };

  // Prepare cards filtered by category for the Study deck
  const studyCards = cards.filter(c => {
    if (selectedCategory === 'All') return true;
    return c.category === selectedCategory;
  });

  const handleNextCard = () => {
    setCurrentIndex(prev => (prev + 1) % studyCards.length);
  };

  const handlePrevCard = () => {
    setCurrentIndex(prev => (prev - 1 + studyCards.length) % studyCards.length);
  };

  const startRevision = (category) => {
    setSelectedCategory(category);
    setCurrentIndex(0);
    setActiveTab('revise');
  };

  // Reset progress for all cards back to learning
  const resetProgress = async () => {
    if (!confirm('Reset revision progress for all cards back to "Learning"?')) return;
    try {
      const updatePromises = cards.map(c => 
        fetch(`${API_URL}/${c._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'learning' })
        })
      );
      await Promise.all(updatePromises);
      fetchCards();
      alert('Progress has been reset!');
    } catch (err) {
      console.error('Error resetting progress:', err);
    }
  };

  // Group TUF Problems by Step
  const tufSteps = tufProblems.reduce((acc, prob) => {
    const step = prob.stepTitle;
    if (!acc[step]) acc[step] = [];
    acc[step].push(prob);
    return acc;
  }, {});

  // Helper stats
  const totalCount = cards.length;
  const masteredCount = cards.filter(c => c.status === 'mastered').length;
  const reviewCount = cards.filter(c => c.status === 'review').length;
  const learningCount = cards.filter(c => c.status === 'learning').length;
  const progressPercent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  // TUF Progress Metrics
  const totalTufCount = tufProblems.length;
  const completedTufCount = Object.values(completedTuf).filter(Boolean).length;
  const tufProgressPercent = totalTufCount > 0 ? Math.round((completedTufCount / totalTufCount) * 100) : 0;

  // Categories list and counts
  const categories = ['Arrays & Hashmaps', 'Linked Lists', 'Stacks & Queues', 'Searching & Sorting', 'Trees & Graphs', 'Dynamic Programming', 'General'];
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = cards.filter(c => c.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="app-container">
      {/* HEADER */}
      <header>
        <h1>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '22px', height: '22px', stroke: 'var(--color-orange)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          DSA Java Revision
        </h1>
        <span className="badge Medium" style={{ textTransform: 'none', padding: '4px 10px', fontSize: '0.65rem' }}>
          TUF A2Z Edition
        </span>
      </header>

      {/* OFFLINE DB WARNING */}
      {error && (
        <div style={{ backgroundColor: 'var(--hard-glow)', color: 'var(--hard)', border: '1.5px solid rgba(239,68,68,0.2)', padding: '10px 15px', margin: '15px 20px 0 20px', borderRadius: '15px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          {error}
        </div>
      )}

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="panel">
          {/* Revision Progress */}
          <div className="progress-ring-container shadow-card">
            <div style={{ flexGrow: 1 }}>
              <span className="eyebrow" style={{ fontSize: '0.65rem' }}>Study Deck Status</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '4px', marginBottom: '2px' }}>Revision Progress</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-slate)' }}>
                {masteredCount} of {totalCount} cards mastered
              </p>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-canvas)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--color-ink)', transition: 'width 0.5s ease-out' }}></div>
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '600', color: 'var(--color-ink)' }}>
              {progressPercent}%
            </div>
          </div>

          {/* TUF A2Z Sheet Progress Card */}
          <div className="progress-ring-container shadow-card" style={{ borderLeft: '4px solid var(--color-orange)', padding: '20px 24px', marginTop: '-8px' }}>
            <div style={{ flexGrow: 1 }}>
              <span className="eyebrow" style={{ fontSize: '0.65rem' }}>Roadmap Tracker</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '4px', marginBottom: '2px' }}>TUF A2Z Sheet Completed</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-slate)' }}>
                {completedTufCount} of {totalTufCount} challenges checked off
              </p>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-canvas)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${tufProgressPercent}%`, height: '100%', background: 'var(--color-orange)', transition: 'width 0.5s ease-out' }}></div>
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '600', color: 'var(--color-orange)', cursor: 'pointer' }} onClick={() => setActiveTab('tuf')}>
              {tufProgressPercent}%
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid" style={{ marginTop: '8px' }}>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--easy)' }}>
              <div className="stat-value" style={{ color: 'var(--easy)' }}>{masteredCount}</div>
              <div className="stat-label">Mastered</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--color-orange)' }}>
              <div className="stat-value" style={{ color: 'var(--color-orange)' }}>{reviewCount}</div>
              <div className="stat-label">Needs Revise</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--medium)' }}>
              <div className="stat-value" style={{ color: 'var(--medium)' }}>{learningCount}</div>
              <div className="stat-label">Learning</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--color-slate)' }}>
              <div className="stat-value">{totalCount}</div>
              <div className="stat-label">Total Cards</div>
            </div>
          </div>

          {/* Category study sections */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Study by Category</h3>
            <button className="nav-btn" style={{ width: 'auto', display: 'inline', fontSize: '0.75rem', color: 'var(--color-slate)', textTransform: 'uppercase', letterSpacing: '0.04em' }} onClick={resetProgress}>
              Reset Progress
            </button>
          </div>

          <div className="category-list">
            <div className="category-item" onClick={() => startRevision('All')}>
              <div className="category-info">
                <div className="category-dot" style={{ backgroundColor: 'var(--color-ink)' }}></div>
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>All Cards</span>
              </div>
              <span className="category-count">{totalCount}</span>
            </div>

            {categories.map(cat => (
              categoryCounts[cat] > 0 && (
                <div key={cat} className="category-item" onClick={() => startRevision(cat)}>
                  <div className="category-info">
                    <div className="category-dot" style={{ backgroundColor: 'var(--color-orange)' }}></div>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{cat}</span>
                  </div>
                  <span className="category-count">{categoryCounts[cat]}</span>
                </div>
              )
            ))}
          </div>

          {totalCount === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-slate)' }}>
              <p>No flashcards available. Head to the "Add Card" tab to create your first Java card!</p>
            </div>
          )}
        </div>
      )}

      {/* REVISE TAB */}
      {activeTab === 'revise' && (
        <div className="panel" style={{ padding: '10px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Deck: {selectedCategory}</h3>
            <div className="form-group" style={{ margin: 0 }}>
              <select 
                className="form-select" 
                value={selectedCategory} 
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentIndex(0);
                }}
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--bg-white)', borderRadius: '20px' }}
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {studyCards.length > 0 ? (
            <div>
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-slate)', marginTop: '8px', fontWeight: 500 }}>
                Card {currentIndex + 1} of {studyCards.length}
              </p>
              
              <Flashcard 
                card={studyCards[currentIndex]} 
                onStatusChange={(status) => updateCardStatus(studyCards[currentIndex]._id, status)}
                onNext={handleNextCard}
                onPrev={handlePrevCard}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-slate)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎉</div>
              <h3 style={{ color: 'var(--color-ink)', marginBottom: '8px', fontWeight: 600 }}>Category Clear!</h3>
              <p style={{ fontSize: '0.85rem' }}>No cards in this category. Select another category or add new cards.</p>
              <button className="btn btn-primary" style={{ marginTop: '20px', borderRadius: '20px' }} onClick={() => setActiveTab('dashboard')}>
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* ADD CARD TAB */}
      {activeTab === 'add' && (
        <div className="panel">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>
            {editingCardId ? 'Edit Flashcard' : 'Add New Flashcard'}
          </h3>

          <form onSubmit={editingCardId ? handleEditCardSubmit : handleAddCard}>
            <div className="form-group">
              <label>Topic / Title</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Reverse a Linked List"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Category</label>
                <select 
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Difficulty</label>
                <select 
                  className="form-select"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description & Core Concept</label>
              <textarea 
                className="form-textarea" 
                placeholder="Describe the problem, optimal approach intuition, or edge cases..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Solution Code (Java)</label>
              <textarea 
                className="form-textarea code-editor" 
                placeholder="public class Solution {&#10;    public void myMethod() {&#10;        // Code here&#10;    }&#10;}"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Time Complexity</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. O(N)"
                  value={formData.timeComplexity}
                  onChange={(e) => setFormData({ ...formData, timeComplexity: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Space Complexity</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. O(1)"
                  value={formData.spaceComplexity}
                  onChange={(e) => setFormData({ ...formData, spaceComplexity: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {editingCardId ? 'Save Changes' : 'Create Flashcard'}
              </button>
              {editingCardId && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setEditingCardId(null);
                    setFormData({
                      title: '',
                      category: 'Arrays & Hashmaps',
                      difficulty: 'Medium',
                      description: '',
                      code: '',
                      timeComplexity: '',
                      spaceComplexity: ''
                    });
                    setActiveTab('list');
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* CARDS LIST TAB */}
      {activeTab === 'list' && (
        <div className="panel">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>Manage Flashcards</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {cards.map(card => (
              <div key={card._id} className="glass shadow-card" style={{ padding: '20px', borderRadius: '20px', borderLeft: `4px solid var(--${card.status === 'mastered' ? 'easy' : card.status === 'review' ? 'orange' : 'medium'})`, background: 'var(--bg-lifted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, color: 'var(--color-ink)', fontSize: '1rem' }}>{card.title}</h4>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span className={`badge ${card.difficulty}`} style={{ fontSize: '0.6rem', padding: '2px 8px' }}>{card.difficulty}</span>
                      <span className="category-count" style={{ fontSize: '0.6rem', padding: '2px 8px' }}>{card.category}</span>
                      <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px', background: 'var(--bg-canvas)', color: 'var(--color-slate)', fontWeight: 600, textTransform: 'uppercase' }}>
                        {card.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Edit/Delete Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.7rem', borderRadius: '20px' }}
                      onClick={() => {
                        setEditingCardId(card._id);
                        setFormData({
                          title: card.title,
                          category: card.category,
                          difficulty: card.difficulty,
                          description: card.description || '',
                          code: card.code,
                          timeComplexity: card.timeComplexity || '',
                          spaceComplexity: card.spaceComplexity || ''
                        });
                        setActiveTab('add');
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.7rem', color: 'var(--hard)', borderColor: 'rgba(239,68,68,0.2)', borderRadius: '20px' }}
                      onClick={() => handleDeleteCard(card._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {cards.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--color-slate)' }}>
                No cards created yet. Click "Add" to make one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TUF A2Z SHEET TAB */}
      {activeTab === 'tuf' && (
        <div className="panel">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '10px' }}>TUF A2Z DSA Roadmap</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-slate)', marginBottom: '20px', lineHeight: '1.4' }}>
            💡 Checklist of the complete takeUforward A2Z sheet. Expand steps to access challenges, copy optimal **Java** implementations, and import them into your active study deck.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {Object.keys(tufSteps).map(stepTitle => {
              const stepProblems = tufSteps[stepTitle];
              const isStepExpanded = expandedTufStep === stepTitle;

              // Calculate how many completed in this step
              const stepCompletedCount = stepProblems.filter(p => !!completedTuf[p.title]).length;

              return (
                <div key={stepTitle} className="glass shadow-card" style={{ borderRadius: '24px', overflow: 'hidden', background: 'var(--bg-lifted)' }}>
                  {/* Step Folder Header */}
                  <div 
                    onClick={() => setExpandedTufStep(isStepExpanded ? null : stepTitle)}
                    style={{ 
                      padding: '18px 24px', 
                      background: isStepExpanded ? 'rgba(207, 69, 0, 0.04)' : 'transparent',
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderBottom: isStepExpanded ? '1px solid var(--border-color)' : 'none',
                      transition: 'background 0.3s ease'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: isStepExpanded ? 'var(--color-orange)' : 'var(--color-ink)' }}>
                        {stepTitle}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-slate)', marginTop: '4px', display: 'inline-block', fontWeight: 600 }}>
                        Progress: {stepCompletedCount} / {stepProblems.length} completed
                      </span>
                    </div>
                    
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={2.5} 
                      stroke="currentColor" 
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        color: 'var(--color-slate)',
                        transform: isStepExpanded ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>

                  {/* Step Folder Problems List */}
                  {isStepExpanded && (
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {stepProblems.map(prob => {
                        const isProbExpanded = expandedTufTitle === prob.title;
                        const isCompleted = !!completedTuf[prob.title];
                        const isImported = cards.some(c => c.title.toLowerCase() === prob.title.toLowerCase());

                        return (
                          <div 
                            key={prob.title} 
                            style={{ 
                              background: 'var(--bg-white)', 
                              border: `1.5px solid ${isProbExpanded ? 'var(--color-orange)' : 'var(--border-color)'}`, 
                              borderRadius: '16px',
                              overflow: 'hidden',
                              transition: 'var(--transition-smooth)'
                            }}
                          >
                            {/* Problem title row */}
                            <div 
                              onClick={() => setExpandedTufTitle(isProbExpanded ? null : prob.title)}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                padding: '12px 16px',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                                {/* Checkbox */}
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTufChecklist(prob.title);
                                  }}
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%', /* perfect circle checkoff */
                                    border: `2px solid ${isCompleted ? 'var(--easy)' : 'var(--color-slate)'}`,
                                    backgroundColor: isCompleted ? 'var(--easy)' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--bg-white)',
                                    fontWeight: 'bold',
                                    fontSize: '0.65rem',
                                    cursor: 'pointer',
                                    transition: 'var(--transition-smooth)'
                                  }}
                                >
                                  {isCompleted && '✓'}
                                </div>
                                <span style={{ 
                                  fontSize: '0.85rem', 
                                  fontWeight: 500,
                                  color: isCompleted ? 'var(--color-slate)' : 'var(--color-ink)',
                                  textDecoration: isCompleted ? 'line-through' : 'none'
                                }}>
                                  {prob.title}
                                </span>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`badge ${prob.difficulty}`} style={{ fontSize: '0.55rem', padding: '1px 6px' }}>
                                  {prob.difficulty}
                                </span>
                              </div>
                            </div>

                            {/* Nested expanded problem info */}
                            {isProbExpanded && (
                              <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-canvas)' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-charcoal)', lineHeight: '1.45', marginBottom: '12px' }}>
                                  {prob.description}
                                </p>
                                
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                  <span style={{ fontSize: '0.7rem', background: 'rgba(207, 69, 0, 0.08)', color: 'var(--color-orange)', padding: '4px 10px', borderRadius: '999px', fontWeight: 600 }}>
                                    Time: {prob.timeComplexity}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', background: 'rgba(20, 20, 19, 0.06)', color: 'var(--color-ink)', padding: '4px 10px', borderRadius: '999px', fontWeight: 600 }}>
                                    Space: {prob.spaceComplexity}
                                  </span>
                                </div>

                                <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-slate)', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.04em' }}>
                                  Optimal Java Solution
                                </h5>
                                <CodeViewer code={prob.code} />

                                <button 
                                  onClick={() => handleImportTufCard(prob)}
                                  disabled={isImported}
                                  className={`btn ${isImported ? 'btn-secondary' : 'btn-primary'}`}
                                  style={{ marginTop: '16px', width: '100%', padding: '10px', fontSize: '0.85rem', borderRadius: '20px' }}
                                >
                                  {isImported ? 'Already in Revision Deck ✓' : 'Add to Java Study Deck'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BOTTOM NAV BAR */}
      <nav className="bottom-nav">
        <button 
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Dashboard
        </button>

        <button 
          className={`nav-btn ${activeTab === 'revise' ? 'active' : ''}`}
          onClick={() => {
            setSelectedCategory('All');
            setCurrentIndex(0);
            setActiveTab('revise');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6A2.25 2.25 0 0 1 6 3.75h1.5m9 0h-9" />
          </svg>
          Study
        </button>

        <button 
          className={`nav-btn ${activeTab === 'tuf' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('tuf');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.408-9-9m9 9-3-1.5m3 1.5 3-1.5M9 21h3.75M9 15h3.75" />
          </svg>
          TUF A2Z
        </button>

        <button 
          className={`nav-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => {
            setEditingCardId(null);
            setFormData({
              title: '',
              category: 'Arrays & Hashmaps',
              difficulty: 'Medium',
              description: '',
              code: '',
              timeComplexity: '',
              spaceComplexity: ''
            });
            setActiveTab('add');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Card
        </button>

        <button 
          className={`nav-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
          Cards List
        </button>
      </nav>
    </div>
  );
}

export default App;
