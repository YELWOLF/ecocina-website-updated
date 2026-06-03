import React, { createContext, useContext, useReducer, useMemo } from 'react';
import { makeId, clampToRoom } from '../utils/geometry.js';

const PlanContext = createContext(null);

const MUTATING = new Set([
  'SET_ROOM', 'ADD_ITEM', 'UPDATE_ITEM', 'MOVE_ITEM',
  'ROTATE_ITEM', 'DUPLICATE_ITEM', 'REMOVE_ITEM',
]);

const initial = {
  plan: {
    id: null,
    name: 'Untitled Plan',
    room: { width: 400, depth: 300, height: 270 },
    items: [],
  },
  past: [],    // snapshots of plan before each mutation
  future: [],  // snapshots of plan for redo
  selectedId: null,
  armedItem: null,
  catalog: null,
  isLoading: false,
  error: null,
};

function planReducer(plan, action) {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...plan, room: { ...plan.room, ...action.room } };

    case 'ADD_ITEM': {
      const item = { ...action.item, id: makeId() };
      return { ...plan, items: [...plan.items, item] };
    }

    case 'UPDATE_ITEM':
      return {
        ...plan,
        items: plan.items.map(it => it.id === action.id ? { ...it, ...action.patch } : it),
      };

    case 'MOVE_ITEM':
      return {
        ...plan,
        items: plan.items.map(it => {
          if (it.id !== action.id) return it;
          const { x, y } = clampToRoom({ ...it, x: action.x, y: action.y }, plan.room);
          return { ...it, x, y };
        }),
      };

    case 'ROTATE_ITEM':
      return {
        ...plan,
        items: plan.items.map(it =>
          it.id === action.id ? { ...it, rotation: (it.rotation + 90) % 360 } : it
        ),
      };

    case 'DUPLICATE_ITEM': {
      const src = plan.items.find(it => it.id === action.id);
      if (!src) return plan;
      const copy = { ...src, id: makeId(), x: src.x + 15, y: src.y + 15 };
      const { x, y } = clampToRoom(copy, plan.room);
      copy.x = x; copy.y = y;
      return { ...plan, items: [...plan.items, copy] };
    }

    case 'REMOVE_ITEM':
      return { ...plan, items: plan.items.filter(it => it.id !== action.id) };

    default:
      return plan;
  }
}

function reducer(state, action) {
  // Non-mutating actions — no history tracking needed
  if (!MUTATING.has(action.type)) {
    switch (action.type) {
      case 'SET_CATALOG':
        return { ...state, catalog: action.catalog };

      case 'SET_PLAN':
        return { ...state, plan: action.plan, selectedId: null, past: [], future: [] };

      case 'ARM_ITEM':
        return { ...state, armedItem: action.item };

      case 'DISARM':
        return { ...state, armedItem: null };

      case 'SELECT':
        return { ...state, selectedId: action.id };

      case 'LOADING':
        return { ...state, isLoading: action.value };

      case 'ERROR':
        return { ...state, error: action.error, isLoading: false };

      case 'UNDO': {
        if (state.past.length === 0) return state;
        const previous = state.past[state.past.length - 1];
        return {
          ...state,
          plan: previous,
          past: state.past.slice(0, -1),
          future: [state.plan, ...state.future],
          selectedId: null,
        };
      }

      case 'REDO': {
        if (state.future.length === 0) return state;
        const next = state.future[0];
        return {
          ...state,
          plan: next,
          past: [...state.past, state.plan],
          future: state.future.slice(1),
          selectedId: null,
        };
      }

      default:
        return state;
    }
  }

  // Mutating action — snapshot current plan into past, clear future
  const newPlan = planReducer(state.plan, action);
  let newSelectedId = state.selectedId;

  // Maintain selectedId for relevant actions
  if (action.type === 'ADD_ITEM') {
    // find the newly added item (last one, since we appended)
    newSelectedId = newPlan.items[newPlan.items.length - 1]?.id ?? null;
  } else if (action.type === 'DUPLICATE_ITEM') {
    newSelectedId = newPlan.items[newPlan.items.length - 1]?.id ?? null;
  } else if (action.type === 'REMOVE_ITEM') {
    newSelectedId = state.selectedId === action.id ? null : state.selectedId;
  }

  return {
    ...state,
    plan: newPlan,
    past: [...state.past, state.plan],
    future: [],
    selectedId: newSelectedId,
    armedItem: action.type === 'ADD_ITEM' ? null : state.armedItem,
  };
}

export function PlanProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const actions = useMemo(() => ({
    setCatalog:  (catalog)    => dispatch({ type: 'SET_CATALOG', catalog }),
    setPlan:     (plan)       => dispatch({ type: 'SET_PLAN', plan }),
    setRoom:     (room)       => dispatch({ type: 'SET_ROOM', room }),
    arm:         (item)       => dispatch({ type: 'ARM_ITEM', item }),
    disarm:      ()           => dispatch({ type: 'DISARM' }),
    addItem:     (item)       => dispatch({ type: 'ADD_ITEM', item }),
    updateItem:  (id, patch)  => dispatch({ type: 'UPDATE_ITEM', id, patch }),
    moveItem:    (id, x, y)   => dispatch({ type: 'MOVE_ITEM', id, x, y }),
    rotateItem:  (id)         => dispatch({ type: 'ROTATE_ITEM', id }),
    duplicate:   (id)         => dispatch({ type: 'DUPLICATE_ITEM', id }),
    removeItem:  (id)         => dispatch({ type: 'REMOVE_ITEM', id }),
    select:      (id)         => dispatch({ type: 'SELECT', id }),
    setLoading:  (v)          => dispatch({ type: 'LOADING', value: v }),
    setError:    (err)        => dispatch({ type: 'ERROR', error: err }),
    undo:        ()           => dispatch({ type: 'UNDO' }),
    redo:        ()           => dispatch({ type: 'REDO' }),
  }), []);

  const selectedItem = useMemo(
    () => state.plan.items.find(it => it.id === state.selectedId) || null,
    [state.plan.items, state.selectedId]
  );

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const value = useMemo(
    () => ({ state, ...actions, selectedItem, canUndo, canRedo }),
    [state, actions, selectedItem, canUndo, canRedo]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used inside <PlanProvider>');
  return ctx;
}
