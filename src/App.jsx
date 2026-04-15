// ============================================================
//  WorkoutPro — App.jsx
//  Tracker de musculation PWA — 100% hors-ligne (localStorage)
//  Stack : React 18 · Tailwind CSS · Recharts
// ============================================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { getUserId } from './supabase.js'

// ============================================================
//  CONSTANTES : Exercices prédéfinis par catégorie
// ============================================================
const PREDEFINED_EXERCISES = [
  // Poitrine
  { id: 'bench_press',      name: 'Développé couché',       category: 'Poitrine' },
  { id: 'incline_bench',    name: 'Développé incliné',      category: 'Poitrine' },
  { id: 'decline_bench',    name: 'Développé décliné',      category: 'Poitrine' },
  { id: 'dips',             name: 'Dips',                   category: 'Poitrine' },
  { id: 'cable_fly',        name: 'Écarté poulie',          category: 'Poitrine' },
  { id: 'pec_deck',         name: 'Pec Deck',               category: 'Poitrine' },
  // Dos
  { id: 'deadlift',         name: 'Soulevé de terre',       category: 'Dos' },
  { id: 'pull_up',          name: 'Tractions',              category: 'Dos' },
  { id: 'row_bar',          name: 'Rowing barre',           category: 'Dos' },
  { id: 'row_dumbbell',     name: 'Rowing haltère',         category: 'Dos' },
  { id: 'lat_pulldown',     name: 'Tirage poulie haute',    category: 'Dos' },
  { id: 'seated_row',       name: 'Tirage horizontal',      category: 'Dos' },
  { id: 'pullover',         name: 'Pullover',               category: 'Dos' },
  // Épaules
  { id: 'ohp',              name: 'Développé militaire',    category: 'Épaules' },
  { id: 'db_press',         name: 'Développé haltères',     category: 'Épaules' },
  { id: 'lateral_raise',    name: 'Élévations latérales',   category: 'Épaules' },
  { id: 'front_raise',      name: 'Élévations frontales',   category: 'Épaules' },
  { id: 'face_pull',        name: 'Face pull',              category: 'Épaules' },
  { id: 'shrug',            name: "Haussements d'épaules",  category: 'Épaules' },
  // Bras
  { id: 'bicep_curl_bar',   name: 'Curl barre',             category: 'Bras' },
  { id: 'bicep_curl_db',    name: 'Curl haltères',          category: 'Bras' },
  { id: 'hammer_curl',      name: 'Curl marteau',           category: 'Bras' },
  { id: 'preacher_curl',    name: 'Curl pupitre',           category: 'Bras' },
  { id: 'tricep_pushdown',  name: 'Pushdown triceps',       category: 'Bras' },
  { id: 'skull_crusher',    name: 'Barre au front',         category: 'Bras' },
  { id: 'overhead_tri',     name: 'Extension triceps haute',category: 'Bras' },
  // Jambes
  { id: 'squat',            name: 'Squat',                  category: 'Jambes' },
  { id: 'leg_press',        name: 'Presse à cuisses',       category: 'Jambes' },
  { id: 'rdl',              name: 'Soulevé roumain',        category: 'Jambes' },
  { id: 'leg_extension',    name: 'Extension jambes',       category: 'Jambes' },
  { id: 'leg_curl',         name: 'Curl jambes couché',     category: 'Jambes' },
  { id: 'seated_leg_curl',  name: 'Curl jambes assis',      category: 'Jambes' },
  { id: 'lunge',            name: 'Fentes',                 category: 'Jambes' },
  { id: 'hip_thrust',       name: 'Hip Thrust',             category: 'Jambes' },
  { id: 'calf_raise',       name: 'Mollets debout',         category: 'Jambes' },
  { id: 'seated_calf',      name: 'Mollets assis',          category: 'Jambes' },
  // Core
  { id: 'plank',            name: 'Gainage',                category: 'Core' },
  { id: 'crunch',           name: 'Crunch',                 category: 'Core' },
  { id: 'leg_raise',        name: 'Relevé de jambes',       category: 'Core' },
  { id: 'ab_wheel',         name: 'Roue abdominale',        category: 'Core' },
  { id: 'cable_crunch',     name: 'Crunch poulie',          category: 'Core' },
]

// Couleurs par catégorie (badge + graphique)
const CATEGORY_COLORS = {
  'Poitrine':  { bg: 'bg-blue-900/60',   text: 'text-blue-300',   hex: '#60A5FA' },
  'Dos':       { bg: 'bg-emerald-900/60',text: 'text-emerald-300',hex: '#34D399' },
  'Épaules':   { bg: 'bg-amber-900/60',  text: 'text-amber-300',  hex: '#FCD34D' },
  'Bras':      { bg: 'bg-orange-900/60', text: 'text-orange-300', hex: '#FB923C' },
  'Jambes':    { bg: 'bg-red-900/60',    text: 'text-red-300',    hex: '#F87171' },
  'Core':      { bg: 'bg-purple-900/60', text: 'text-purple-300', hex: '#C084FC' },
  'Perso':     { bg: 'bg-gray-700',      text: 'text-gray-300',   hex: '#9CA3AF' },
}

// ============================================================
//  PERSISTANCE : localStorage
// ============================================================

import { supabase, getUserId } from './supabase.js'

const loadFromStorage = async () => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('data')
      .eq('user_id', getUserId())
      .single()
    if (error || !data) throw new Error()
    return data.data
  } catch {
    const raw = localStorage.getItem('wp_cache')
    return raw ? JSON.parse(raw) : { sessions: [], customExercises: [] }
  }
}

const saveToStorage = async (appData) => {
  localStorage.setItem('wp_cache', JSON.stringify(appData))
  try {
    await supabase.from('sessions').upsert({
      id: getUserId(),
      user_id: getUserId(),
      data: appData,
      updated_at: new Date().toISOString(),
    })
  } catch (e) {
    console.warn('[WorkoutPro] Sauvegarde cloud echouee, cache local utilise')
  }
}

// ============================================================
//  UTILITAIRES
// ============================================================

/** Génère un identifiant unique court. */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

/** Formate une date ISO en chaîne lisible (ex : "lun. 14 avr."). */
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

/** Formate une heure ISO (ex : "09:30"). */
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** Durée en minutes entre deux timestamps ISO. */
const durationMin = (start, end) =>
  Math.round((new Date(end) - new Date(start)) / 60000)

/** Calcule le volume total d'un exercice (Σ reps × poids). */
const calcVolume = (sets) =>
  sets.reduce((acc, s) => acc + (parseFloat(s.reps) || 0) * (parseFloat(s.weight) || 0), 0)

/** Poids maximum d'un exercice sur ses séries. */
const maxWeight = (sets) =>
  sets.length ? Math.max(...sets.map(s => parseFloat(s.weight) || 0)) : 0

// ============================================================
//  HOOK : Timer de repos
// ============================================================
/**
 * Gère un compte-à-rebours avec alerte sonore + vibration à zéro.
 * Retourne : { seconds, isRunning, target, setTarget, start, stop }
 */
const useRestTimer = () => {
  const [seconds,   setSeconds]   = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [target,    setTarget]    = useState(90) // durée par défaut
  const tickRef = useRef(null)

  /** Joue un bip de fin via Web Audio API + vibration. */
  const playEndSound = useCallback(() => {
    // Son
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      // Deux tonalités ascendantes
      osc.frequency.setValueAtTime(660, ctx.currentTime)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.45, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.6)
    } catch { /* Contexte audio non disponible */ }
    // Vibration
    try { navigator.vibrate?.([150, 80, 150, 80, 250]) } catch {}
  }, [])

  /** Démarre le timer avec une durée optionnelle. */
  const start = useCallback((duration) => {
    const d = duration ?? target
    setTarget(d)
    setSeconds(d)
    setIsRunning(true)
  }, [target])

  /** Arrête et remet à zéro. */
  const stop = useCallback(() => {
    setIsRunning(false)
    setSeconds(0)
    clearInterval(tickRef.current)
  }, [])

  // Tick chaque seconde
  useEffect(() => {
    if (!isRunning) return
    tickRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          setIsRunning(false)
          playEndSound()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [isRunning, playEndSound])

  return { seconds, isRunning, target, setTarget, start, stop }
}

// ============================================================
//  COMPOSANT : Badge de catégorie
// ============================================================
const CatBadge = ({ category }) => {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS['Perso']
  return (
    <span className={`text-[11px] font-display font-600 px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      {category || 'Perso'}
    </span>
  )
}

// ============================================================
//  COMPOSANT : Modal de sélection d'exercice
// ============================================================
const ExerciseModal = ({ allExercises, onSelect, onClose }) => {
  const [query,     setQuery]     = useState('')
  const [newName,   setNewName]   = useState('')
  const [showNew,   setShowNew]   = useState(false)
  const inputRef = useRef(null)

  // Focus automatique sur la barre de recherche
  useEffect(() => { inputRef.current?.focus() }, [])

  // Filtrage dynamique
  const filtered = useMemo(() =>
    allExercises.filter(e =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(query.toLowerCase())
    ), [allExercises, query]
  )

  // Groupement par catégorie
  const grouped = useMemo(() =>
    filtered.reduce((acc, ex) => {
      const cat = ex.category || 'Perso'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(ex)
      return acc
    }, {}), [filtered]
  )

  const handleCreateCustom = () => {
    const name = newName.trim()
    if (!name) return
    onSelect({ id: uid(), name, category: null, isCustom: true })
  }

  return (
    // Fond semi-transparent
    <div className="fixed inset-0 z-50 bg-black/75 flex flex-col" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#141417] flex flex-col overflow-hidden rounded-t-3xl mt-auto h-[90vh]">

        {/* En-tête */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2A2A32]">
          <button onClick={onClose} className="text-gray-500 text-2xl w-9 h-9 flex items-center justify-center">✕</button>
          <h2 className="font-display font-700 text-white text-xl tracking-wide flex-1">CHOISIR UN EXERCICE</h2>
        </div>

        {/* Barre de recherche */}
        <div className="px-4 py-3 border-b border-[#2A2A32]">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un exercice..."
              className="input-base pl-10"
            />
          </div>
        </div>

        {/* Liste scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          {Object.keys(grouped).length === 0 && (
            <p className="text-gray-600 text-center py-10">Aucun exercice trouvé</p>
          )}
          {Object.entries(grouped).map(([cat, exs]) => (
            <div key={cat}>
              <p className="font-display font-600 text-[11px] tracking-widest text-gray-500 uppercase mb-2 px-1">{cat}</p>
              <div className="space-y-1">
                {exs.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => onSelect(ex)}
                    className="w-full text-left bg-[#1C1C21] hover:bg-[#22222a] border border-[#2A2A32] px-4 py-3.5 rounded-2xl
                               flex justify-between items-center active:scale-[0.97] transition-transform"
                  >
                    <span className="font-body font-500 text-white">{ex.name}</span>
                    <CatBadge category={ex.category} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Créer un exercice personnalisé */}
        <div className="px-4 py-3 border-t border-[#2A2A32]">
          {showNew ? (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateCustom()}
                placeholder="Nom de l'exercice..."
                className="input-base flex-1"
              />
              <button
                onClick={handleCreateCustom}
                className="btn-primary !w-auto px-5 text-base"
              >OK</button>
            </div>
          ) : (
            <button
              onClick={() => setShowNew(true)}
              className="w-full border border-dashed border-[#2A2A32] text-gray-500 py-3.5 rounded-2xl font-display
                         font-600 text-sm tracking-wide hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
            >
              + CRÉER UN EXERCICE PERSONNALISÉ
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
//  COMPOSANT : Ligne de série (saisie reps + poids)
// ============================================================
const SetRow = ({ set, index, onChange, onRemove }) => (
  <div className="set-row grid grid-cols-12 gap-2 items-center px-1 py-1">
    {/* Numéro de série */}
    <span className="col-span-1 font-mono text-gray-600 text-sm text-center">{index + 1}</span>

    {/* Répétitions */}
    <input
      type="number"
      inputMode="numeric"
      value={set.reps === '' ? '' : set.reps}
      onChange={e => onChange('reps', e.target.value)}
      placeholder="—"
      min="0"
      className="input-num col-span-4"
    />

    {/* Poids */}
    <div className="col-span-5 relative">
      <input
        type="number"
        inputMode="decimal"
        value={set.weight === '' ? '' : set.weight}
        onChange={e => onChange('weight', e.target.value)}
        placeholder="—"
        min="0"
        step="0.5"
        className="input-num w-full"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono pointer-events-none">kg</span>
    </div>

    {/* Supprimer */}
    <button
      onClick={onRemove}
      className="col-span-2 text-gray-700 hover:text-red-500 transition-colors text-lg flex justify-center"
      aria-label="Supprimer la série"
    >✕</button>
  </div>
)

// ============================================================
//  COMPOSANT : Bloc d'exercice dans la séance active
// ============================================================
const ExerciseBlock = ({
  exercise,        // { exerciseId, exerciseName, category, sets: [{reps, weight}] }
  exIndex,
  lastSessionSets, // séries de la dernière fois pour cet exercice
  onAddSet,
  onCopySet,
  onUpdateSet,
  onRemoveSet,
  onRemoveExercise,
}) => {
  // Poids max de la dernière séance pour cet exercice
  const lastMax = lastSessionSets ? maxWeight(lastSessionSets) : null

  return (
    <div className="card p-4 mb-3 animate-in">
      {/* En-tête de l'exercice */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-display font-700 text-white text-xl leading-tight tracking-wide">
            {exercise.exerciseName.toUpperCase()}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <CatBadge category={exercise.category} />
            {/* Suggestion de charge depuis la dernière séance */}
            {lastMax > 0 && (
              <span className="text-[11px] font-mono text-[#6366F1]">
                ↑ {lastMax} kg dernière fois
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemoveExercise(exIndex)}
          className="text-gray-700 hover:text-red-500 text-xl transition-colors p-1"
          aria-label="Supprimer l'exercice"
        >✕</button>
      </div>

      {/* En-tête des colonnes */}
      {exercise.sets.length > 0 && (
        <div className="grid grid-cols-12 gap-2 px-1 mb-1">
          <span className="col-span-1 text-[10px] text-gray-600 text-center">#</span>
          <span className="col-span-4 text-[10px] text-gray-600 text-center font-display tracking-wider">REPS</span>
          <span className="col-span-5 text-[10px] text-gray-600 text-center font-display tracking-wider">POIDS</span>
        </div>
      )}

      {/* Séries */}
      {exercise.sets.map((set, si) => (
        <SetRow
          key={si}
          set={set}
          index={si}
          onChange={(field, val) => onUpdateSet(exIndex, si, field, val)}
          onRemove={() => onRemoveSet(exIndex, si)}
        />
      ))}

      {/* Boutons d'action */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onAddSet(exIndex)}
          className="flex-1 btn-secondary py-3 text-sm"
        >+ SÉRIE</button>
        {exercise.sets.length > 0 && (
          <button
            onClick={() => onCopySet(exIndex)}
            className="flex-1 py-3 rounded-[14px] bg-[#312E81]/40 border border-[#312E81] text-[#818CF8]
                       font-display font-600 text-sm tracking-wide active:scale-95 transition-transform"
          >⧉ COPIER</button>
        )}
      </div>
    </div>
  )
}

// ============================================================
//  COMPOSANT : Timer de repos (barre flottante)
// ============================================================
const TimerBar = ({ timer }) => {
  const { seconds, isRunning, target, start, stop } = timer
  const PRESETS = [60, 90, 120, 180]
  const progress = target > 0 ? (seconds / target) * 100 : 0

  // État repos terminé → affichage des raccourcis
  if (!isRunning && seconds === 0) {
    return (
      <div className="fixed bottom-[68px] left-0 right-0 flex justify-center gap-2 px-4 z-40 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => start(p)}
              className="bg-[#1C1C21]/95 backdrop-blur border border-[#2A2A32] text-gray-400
                         px-3.5 py-2 rounded-full text-xs font-mono active:scale-95 transition-transform
                         hover:border-[#6366F1] hover:text-[#6366F1]"
            >
              {p}s
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Timer en cours
  const urgent = seconds <= 10 && isRunning
  return (
    <div className="fixed bottom-[68px] left-0 right-0 z-40 px-4">
      <div className={`bg-[#1C1C21]/95 backdrop-blur border rounded-2xl px-4 py-3 flex items-center gap-3
                       transition-all ${urgent ? 'border-red-800 timer-pulse' : 'border-[#2A2A32]'}`}>
        {/* Barre de progression */}
        <div className="flex-1 bg-[#2A2A32] rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear
                        ${urgent ? 'bg-red-500' : 'bg-[#6366F1]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Décompte */}
        <span className={`font-mono font-600 text-xl w-14 text-right tabular-nums
                          ${urgent ? 'text-red-400' : 'text-white'}`}>
          {seconds}s
        </span>
        {/* Stopper */}
        <button onClick={stop} className="text-gray-600 hover:text-white text-lg transition-colors">✕</button>
      </div>
    </div>
  )
}

// ============================================================
//  VUE 1 : Séance en cours
// ============================================================
const SessionView = ({ data, setData, timer }) => {
  const [showModal,    setShowModal]    = useState(false)
  const [editingName,  setEditingName]  = useState(false)
  const [nameInput,    setNameInput]    = useState('')
  const [sessionLabel, setSessionLabel] = useState('')
  const bottomRef = useRef(null)

  // Séance active (au plus une à la fois)
  const session = useMemo(() => data.sessions.find(s => s.isActive), [data.sessions])
  // Tous les exercices disponibles (prédéfinis + personnalisés)
  const allExercises = useMemo(() =>
    [...PREDEFINED_EXERCISES, ...data.customExercises], [data.customExercises]
  )

  // --- Créer une nouvelle séance ---
  const createSession = () => {
    const s = {
      id:        uid(),
      name:      sessionLabel.trim() || 'Séance',
      date:      new Date().toISOString(),
      endDate:   null,
      isActive:  true,
      exercises: [],
    }
    setData(prev => {
      const next = { ...prev, sessions: [...prev.sessions, s] }
      saveToStorage(next)
      return next
    })
    setSessionLabel('')
  }

  // --- Terminer la séance ---
  const finishSession = () => {
    if (!session) return
    if (session.exercises.length === 0 && !window.confirm('Terminer la séance sans exercices ?')) return
    setData(prev => {
      const next = {
        ...prev,
        sessions: prev.sessions.map(s =>
          s.id === session.id
            ? { ...s, isActive: false, endDate: new Date().toISOString() }
            : s
        ),
      }
      saveToStorage(next)
      return next
    })
  }

  // --- Mettre à jour le nom de la séance ---
  const updateSessionName = (name) => {
    setData(prev => {
      const next = {
        ...prev,
        sessions: prev.sessions.map(s =>
          s.id === session.id ? { ...s, name: name || 'Séance' } : s
        ),
      }
      saveToStorage(next)
      return next
    })
  }

  // --- Ajouter un exercice ---
  const addExercise = (ex) => {
    setData(prev => {
      // Enregistrer l'exercice personnalisé s'il est nouveau
      let customExercises = prev.customExercises
      if (ex.isCustom && !customExercises.some(e => e.id === ex.id)) {
        customExercises = [...customExercises, { id: ex.id, name: ex.name, category: null }]
      }
      const newEx = {
        exerciseId:   ex.id,
        exerciseName: ex.name,
        category:     ex.category || null,
        sets: [],
      }
      const next = {
        ...prev,
        customExercises,
        sessions: prev.sessions.map(s =>
          s.id === session.id
            ? { ...s, exercises: [...s.exercises, newEx] }
            : s
        ),
      }
      saveToStorage(next)
      return next
    })
    setShowModal(false)
    // Scroll vers le bas pour voir le nouvel exercice
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  // --- Modifier une séance (helper générique) ---
  const mutateSession = useCallback((updater) => {
    setData(prev => {
      const next = {
        ...prev,
        sessions: prev.sessions.map(s => s.id === session.id ? updater(s) : s),
      }
      saveToStorage(next)
      return next
    })
  }, [session, setData])

  // --- Ajouter une série vide ---
  const addSet = (exIndex) => {
    mutateSession(s => ({
      ...s,
      exercises: s.exercises.map((ex, i) =>
        i !== exIndex ? ex : { ...ex, sets: [...ex.sets, { reps: '', weight: '' }] }
      ),
    }))
  }

  // --- Copier la dernière série ---
  const copyLastSet = (exIndex) => {
    mutateSession(s => {
      const sets = s.exercises[exIndex].sets
      const last = sets[sets.length - 1]
      return {
        ...s,
        exercises: s.exercises.map((ex, i) =>
          i !== exIndex ? ex : { ...ex, sets: [...ex.sets, { ...last }] }
        ),
      }
    })
  }

  // --- Mettre à jour reps ou poids d'une série ---
  const updateSet = (exIndex, setIndex, field, val) => {
    mutateSession(s => ({
      ...s,
      exercises: s.exercises.map((ex, i) =>
        i !== exIndex ? ex : {
          ...ex,
          sets: ex.sets.map((set, j) =>
            j !== setIndex ? set : {
              ...set,
              [field]: field === 'reps'
                ? (val === '' ? '' : parseInt(val, 10)  || '')
                : (val === '' ? '' : parseFloat(val)    || ''),
            }
          ),
        }
      ),
    }))
  }

  // --- Supprimer une série ---
  const removeSet = (exIndex, setIndex) => {
    mutateSession(s => ({
      ...s,
      exercises: s.exercises.map((ex, i) =>
        i !== exIndex ? ex : { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) }
      ),
    }))
  }

  // --- Supprimer un exercice ---
  const removeExercise = (exIndex) => {
    mutateSession(s => ({
      ...s,
      exercises: s.exercises.filter((_, i) => i !== exIndex),
    }))
  }

  // --- Trouver les séries de la dernière séance pour un exercice ---
  const getLastSets = useCallback((exerciseId) => {
    const past = data.sessions
      .filter(s => !s.isActive && s.exercises.some(e => e.exerciseId === exerciseId))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    if (!past.length) return null
    return past[0].exercises.find(e => e.exerciseId === exerciseId)?.sets || null
  }, [data.sessions])

  // ─── Écran d'accueil (pas de séance active) ──────────────
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 gap-8">
        {/* Logo / headline */}
        <div className="text-center">
          <div className="text-7xl mb-4 select-none">🏋️</div>
          <h1 className="font-display font-800 text-white text-4xl tracking-widest">WORKOUTPRO</h1>
          <p className="text-gray-600 text-sm mt-1 font-body">Tracker hors-ligne · Push · Pull · Legs</p>
        </div>

        {/* Formulaire de démarrage */}
        <div className="w-full max-w-sm space-y-3">
          <input
            type="text"
            value={sessionLabel}
            onChange={e => setSessionLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createSession()}
            placeholder="Nom de la séance (Push Day, Legs…)"
            className="input-base text-base"
          />
          <button
            onClick={createSession}
            className="btn-primary text-xl py-5 accent-glow"
          >
            DÉMARRER LA SÉANCE
          </button>
        </div>

        {/* Stats rapides */}
        {data.sessions.filter(s => !s.isActive).length > 0 && (
          <p className="text-gray-700 text-sm">
            {data.sessions.filter(s => !s.isActive).length} séances dans l'historique
          </p>
        )}
      </div>
    )
  }

  // ─── Séance en cours ─────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* En-tête de séance */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A32] shrink-0">
        <div className="flex-1">
          {editingName ? (
            <input
              autoFocus
              type="text"
              defaultValue={session.name}
              onBlur={e => { updateSessionName(e.target.value); setEditingName(false) }}
              onKeyDown={e => { if (e.key === 'Enter') { updateSessionName(e.target.value); setEditingName(false) } }}
              className="font-display font-700 text-white text-xl tracking-wide bg-transparent
                         outline-none border-b-2 border-[#6366F1] w-full"
            />
          ) : (
            <button onClick={() => setEditingName(true)} className="text-left">
              <span className="font-display font-700 text-white text-xl tracking-wide">{session.name}</span>
              <span className="text-gray-600 text-base ml-1">✎</span>
            </button>
          )}
          <p className="text-gray-600 text-xs mt-0.5 font-mono">
            {fmtDate(session.date)} · {fmtTime(session.date)}
          </p>
        </div>
        <button
          onClick={finishSession}
          className="bg-emerald-800/60 border border-emerald-700 text-emerald-400 px-4 py-2.5
                     rounded-xl font-display font-700 text-sm tracking-wide active:scale-95 transition-transform"
        >
          TERMINER ✓
        </button>
      </div>

      {/* Liste des exercices */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-40">
        {session.exercises.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-700 text-4xl mb-3">🏋️</p>
            <p className="text-gray-600 font-display text-lg tracking-wide">AJOUTE TON PREMIER EXERCICE</p>
          </div>
        )}

        {session.exercises.map((ex, exIdx) => (
          <ExerciseBlock
            key={`${ex.exerciseId}-${exIdx}`}
            exercise={ex}
            exIndex={exIdx}
            lastSessionSets={getLastSets(ex.exerciseId)}
            onAddSet={addSet}
            onCopySet={copyLastSet}
            onUpdateSet={updateSet}
            onRemoveSet={removeSet}
            onRemoveExercise={removeExercise}
          />
        ))}

        {/* Bouton ajouter exercice */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full border-2 border-dashed border-[#2A2A32] hover:border-[#6366F1] text-gray-600
                     hover:text-[#6366F1] py-5 rounded-2xl font-display font-700 text-base tracking-widest
                     active:scale-95 transition-all"
        >
          + AJOUTER UN EXERCICE
        </button>
        <div ref={bottomRef} />
      </div>

      {/* Timer flottant */}
      <TimerBar timer={timer} />

      {/* Modal de sélection */}
      {showModal && (
        <ExerciseModal
          allExercises={allExercises}
          onSelect={addExercise}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

// ============================================================
//  VUE 2 : Historique des séances
// ============================================================
const HistoryView = ({ data, setData }) => {
  const [openId, setOpenId] = useState(null)

  const finished = useMemo(() =>
    [...data.sessions.filter(s => !s.isActive)]
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [data.sessions]
  )

  // Supprimer une séance de l'historique
  const deleteSession = (id) => {
    if (!window.confirm('Supprimer cette séance ?')) return
    setData(prev => {
      const next = { ...prev, sessions: prev.sessions.filter(s => s.id !== id) }
      saveToStorage(next)
      return next
    })
    if (openId === id) setOpenId(null)
  }

  // Vue détaillée d'une séance
  if (openId) {
    const s = finished.find(s => s.id === openId)
    if (!s) { setOpenId(null); return null }
    const totalVol = s.exercises.reduce((acc, ex) => acc + calcVolume(ex.sets), 0)
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2A2A32] shrink-0">
          <button onClick={() => setOpenId(null)} className="text-[#6366F1] text-2xl">←</button>
          <div className="flex-1">
            <h2 className="font-display font-700 text-white text-xl tracking-wide">{s.name}</h2>
            <p className="text-gray-600 text-xs font-mono">
              {fmtDate(s.date)} · {fmtTime(s.date)}
              {s.endDate && ` · ${durationMin(s.date, s.endDate)} min`}
            </p>
          </div>
          <button onClick={() => deleteSession(s.id)} className="text-red-800 hover:text-red-500 text-xl transition-colors px-2">🗑</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* Résumé */}
          <div className="card p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-mono font-600 text-[#6366F1] text-2xl">{s.exercises.length}</p>
              <p className="text-gray-600 text-xs font-display tracking-wider">EXERCICES</p>
            </div>
            <div>
              <p className="font-mono font-600 text-[#6366F1] text-2xl">
                {s.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}
              </p>
              <p className="text-gray-600 text-xs font-display tracking-wider">SÉRIES</p>
            </div>
            <div>
              <p className="font-mono font-600 text-[#6366F1] text-2xl">{Math.round(totalVol)}</p>
              <p className="text-gray-600 text-xs font-display tracking-wider">KG TOTAL</p>
            </div>
          </div>

          {/* Détail par exercice */}
          {s.exercises.map((ex, i) => {
            const vol = calcVolume(ex.sets)
            const mx  = maxWeight(ex.sets)
            return (
              <div key={i} className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-display font-700 text-white text-lg tracking-wide flex-1">
                    {ex.exerciseName.toUpperCase()}
                  </h3>
                  <CatBadge category={ex.category} />
                </div>
                {/* Colonnes */}
                <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-600 font-display tracking-widest mb-2 px-1">
                  <span>#</span><span className="text-center">REPS</span><span className="text-right">POIDS</span>
                </div>
                {ex.sets.map((set, j) => (
                  <div key={j} className="grid grid-cols-3 gap-2 py-1.5 border-t border-[#2A2A32]">
                    <span className="text-gray-600 font-mono text-sm">{j + 1}</span>
                    <span className="text-white font-mono text-sm text-center">{set.reps || '—'}</span>
                    <span className="text-white font-mono text-sm text-right">{set.weight ? `${set.weight} kg` : '—'}</span>
                  </div>
                ))}
                <div className="flex justify-between mt-3 pt-2 border-t border-[#2A2A32] text-xs font-mono">
                  <span className="text-gray-600">{ex.sets.length} séries · max {mx} kg</span>
                  <span className="text-[#6366F1]">vol. {Math.round(vol)} kg</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Liste des séances
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2A2A32] shrink-0">
        <h2 className="font-display font-700 text-white text-xl tracking-widest">HISTORIQUE</h2>
        <p className="text-gray-600 text-xs font-mono mt-0.5">{finished.length} séances terminées</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {finished.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-700 font-display text-lg tracking-wide">AUCUNE SÉANCE TERMINÉE</p>
            <p className="text-gray-700 text-sm mt-1">Tes séances passées apparaîtront ici</p>
          </div>
        )}
        {finished.map(s => {
          const totalVol = s.exercises.reduce((acc, ex) => acc + calcVolume(ex.sets), 0)
          const dur = s.endDate ? durationMin(s.date, s.endDate) : null
          return (
            <button
              key={s.id}
              onClick={() => setOpenId(s.id)}
              className="card w-full text-left p-4 active:scale-[0.98] transition-transform hover:border-[#6366F1]/40"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-700 text-white text-lg tracking-wide">{s.name}</h3>
                  <p className="text-gray-600 text-xs font-mono mt-0.5">
                    {fmtDate(s.date)} · {fmtTime(s.date)}
                    {dur && ` · ${dur} min`}
                  </p>
                </div>
                <span className="text-gray-700 text-xl">›</span>
              </div>
              <div className="flex gap-4 mt-3 text-xs font-mono">
                <span className="text-gray-500">{s.exercises.length} exercices</span>
                <span className="text-gray-500">{s.exercises.reduce((a, ex) => a + ex.sets.length, 0)} séries</span>
                <span className="text-[#6366F1]">{Math.round(totalVol)} kg vol.</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
//  VUE 3 : Progression (graphiques Recharts)
// ============================================================
const ProgressView = ({ data }) => {
  const [selectedId, setSelectedId] = useState(null)
  const [metric,     setMetric]     = useState('maxWeight') // 'maxWeight' | 'volume'

  // Construire la liste des exercices présents dans l'historique
  const exercisesInHistory = useMemo(() => {
    const seen = new Map()
    data.sessions.filter(s => !s.isActive).forEach(s =>
      s.exercises.forEach(ex => {
        if (!seen.has(ex.exerciseId)) seen.set(ex.exerciseId, ex.exerciseName)
      })
    )
    return [...seen.entries()].map(([id, name]) => ({ id, name }))
  }, [data.sessions])

  // Données du graphique pour l'exercice sélectionné
  const chartData = useMemo(() => {
    if (!selectedId) return []
    return data.sessions
      .filter(s => !s.isActive && s.exercises.some(e => e.exerciseId === selectedId))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(s => {
        const ex = s.exercises.find(e => e.exerciseId === selectedId)
        const mx  = ex ? maxWeight(ex.sets) : 0
        const vol = ex ? Math.round(calcVolume(ex.sets)) : 0
        return { date: fmtDate(s.date), maxWeight: mx, volume: vol }
      })
  }, [selectedId, data.sessions])

  // Meilleure perf (pour la ligne de référence)
  const bestValue = useMemo(() =>
    chartData.length ? Math.max(...chartData.map(d => d[metric])) : 0,
    [chartData, metric]
  )

  // Tooltip custom
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#1C1C21] border border-[#2A2A32] rounded-xl p-3 text-xs font-mono shadow-xl">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="text-[#818CF8] font-600">
          {payload[0].value} {metric === 'volume' ? 'kg vol.' : 'kg max'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2A2A32] shrink-0">
        <h2 className="font-display font-700 text-white text-xl tracking-widest">PROGRESSION</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {exercisesInHistory.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-700 font-display text-lg tracking-wide">AUCUNE DONNÉE</p>
            <p className="text-gray-700 text-sm mt-1">Termine des séances pour voir tes courbes</p>
          </div>
        )}

        {/* Sélecteur d'exercice */}
        {exercisesInHistory.length > 0 && (
          <div className="mb-5">
            <p className="font-display font-600 text-[11px] tracking-widest text-gray-500 uppercase mb-2">
              Choisir un exercice
            </p>
            <div className="flex flex-col gap-1.5">
              {exercisesInHistory.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedId(ex.id)}
                  className={`py-3.5 px-4 rounded-xl text-left font-display font-600 tracking-wide
                              transition-all active:scale-[0.97] border
                              ${selectedId === ex.id
                                ? 'bg-[#312E81]/50 border-[#6366F1] text-white'
                                : 'card text-gray-400 hover:border-[#6366F1]/40'}`}
                >
                  {ex.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Graphique */}
        {selectedId && chartData.length >= 2 && (
          <div className="card p-4 mb-4">
            {/* Toggle métrique */}
            <div className="flex gap-2 mb-5">
              {[['maxWeight', 'POIDS MAX'], ['volume', 'VOLUME TOTAL']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMetric(key)}
                  className={`flex-1 py-2.5 rounded-xl font-display font-700 text-xs tracking-widest
                              transition-all border ${metric === key
                                ? 'bg-[#6366F1] border-[#6366F1] text-white'
                                : 'border-[#2A2A32] text-gray-500 hover:border-[#6366F1]/40'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A32" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#4B5563', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: '#4B5563', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                  unit=" kg"
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Ligne de record */}
                <ReferenceLine
                  y={bestValue}
                  stroke="#6366F1"
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke="#818CF8"
                  strokeWidth={2.5}
                  dot={{ fill: '#6366F1', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#818CF8', stroke: '#312E81', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Record */}
            <div className="mt-4 pt-3 border-t border-[#2A2A32] flex justify-between items-center">
              <span className="text-gray-600 text-xs font-display tracking-wider">
                {metric === 'maxWeight' ? 'RECORD POIDS' : 'MEILLEUR VOLUME'}
              </span>
              <span className="font-mono font-600 text-[#6366F1] text-lg">{bestValue} kg</span>
            </div>
          </div>
        )}

        {/* Message si une seule séance */}
        {selectedId && chartData.length === 1 && (
          <div className="card p-5 text-center">
            <p className="text-gray-500 text-sm">Une seule séance enregistrée pour cet exercice.</p>
            <p className="text-gray-700 text-xs mt-1">La courbe apparaîtra à partir de 2 séances.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
//  VUE 4 : Paramètres, export et statistiques
// ============================================================
const SettingsView = ({ data, setData, timer }) => {

  // --- Logique de l'ID utilisateur ---
  const userId = getUserId()
  const [copied, setCopied] = useState(false)

  const copyId = () => {
    navigator.clipboard.writeText(userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // --- Export JSON ---
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `workoutpro_export_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- Export CSV ---
  const exportCSV = () => {
    const header = ['Date', 'Heure', 'Séance', 'Exercice', 'Catégorie', 'Série', 'Reps', 'Poids (kg)', 'Volume (kg)']
    const rows = [header.join(',')]
    data.sessions.filter(s => !s.isActive).forEach(s => {
      s.exercises.forEach(ex => {
        ex.sets.forEach((set, idx) => {
          rows.push([
            s.date.slice(0, 10),
            fmtTime(s.date),
            `"${s.name}"`,
            `"${ex.exerciseName}"`,
            `"${ex.category || 'Perso'}"`,
            idx + 1,
            set.reps || 0,
            set.weight || 0,
            ((set.reps || 0) * (set.weight || 0)).toFixed(1),
          ].join(','))
        })
      })
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `workoutpro_export_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- Tout effacer ---
  const clearAll = () => {
    if (!window.confirm('Supprimer TOUTES les données ? Cette action est irréversible.')) return
    const empty = { sessions: [], customExercises: [] }
    saveToStorage(empty)
    setData(empty)
  }

  // Statistiques globales
  const finished = data.sessions.filter(s => !s.isActive)
  const totalSets = finished.reduce((acc, s) =>
    acc + s.exercises.reduce((a, ex) => a + ex.sets.length, 0), 0)
  const totalVolume = finished.reduce((acc, s) =>
    acc + s.exercises.reduce((a, ex) => a + calcVolume(ex.sets), 0), 0)



  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-4 space-y-4">
      <h2 className="font-display font-700 text-white text-xl tracking-widest px-1">RÉGLAGES</h2>

      {/* BLOC 1 : Affichage et copie de l'identifiant */}
      <div className="card p-4">
        <p className="font-display font-600 text-[11px] tracking-widest text-gray-500 uppercase mb-3">
          Identifiant appareil
        </p>
        <p className="font-mono text-xs text-gray-400 break-all mb-3 bg-[#141417] p-3 rounded-xl">
          {userId}
        </p>
        <button onClick={copyId} className="btn-secondary w-full py-3 text-sm">
          {copied ? '✓ Copié !' : 'Copier mon identifiant'}
        </button>
        <p className="text-gray-700 text-xs mt-3 text-center">
          Colle cet identifiant dans les Paramètres de l'autre appareil pour synchroniser.
        </p>
      </div>

      {/* BLOC 2 : Formulaire pour rejoindre un autre appareil */}
      <div className="card p-4">
        <p className="font-display font-600 text-[11px] tracking-widest text-gray-500 uppercase mb-3">
          Rejoindre un autre appareil
        </p>
        <input
          type="text"
          placeholder="Colle ici l'identifiant de ton autre appareil"
          className="input-base text-xs mb-3"
          id="pasteId"
        />
        <button
          onClick={() => {
            const val = document.getElementById('pasteId').value.trim()
            if (!val) return
            if (!window.confirm('Remplacer ton identifiant actuel ? Les données locales seront remplacées par celles de l\'autre appareil.')) return
            localStorage.setItem('wp_user_id', val)
            window.location.reload()
          }}
          className="btn-primary text-sm py-3"
        >
          Synchroniser avec cet appareil
        </button>
      </div>

      {/* Statistiques globales */}
      <div className="card p-4">
        <p className="font-display font-600 text-[11px] tracking-widest text-gray-500 uppercase mb-4">Statistiques globales</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['SÉANCES', finished.length],
            ['SÉRIES',  totalSets],
            ['EXERCICES PERSO', data.customExercises.length],
            ['VOLUME TOTAL', `${Math.round(totalVolume / 1000)}T`],
          ].map(([label, val]) => (
            <div key={label} className="bg-[#141417] rounded-xl p-3 text-center">
              <p className="font-mono font-600 text-[#6366F1] text-2xl">{val}</p>
              <p className="font-display text-gray-600 text-[10px] tracking-widest mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timer de repos par défaut */}
      <div className="card p-4">
        <p className="font-display font-600 text-[11px] tracking-widest text-gray-500 uppercase mb-3">
          Timer de repos par défaut
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[60, 90, 120, 180].map(sec => (
            <button
              key={sec}
              onClick={() => timer.setTarget(sec)}
              className={`py-3 rounded-xl font-mono font-600 text-sm border transition-all
                          ${timer.target === sec
                            ? 'bg-[#6366F1] border-[#6366F1] text-white'
                            : 'border-[#2A2A32] text-gray-500 hover:border-[#6366F1]/40'}`}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="card p-4">
        <p className="font-display font-600 text-[11px] tracking-widest text-gray-500 uppercase mb-3">
          Exporter les données
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={exportJSON}
            className="btn-secondary py-4 text-sm font-display font-700 tracking-wider"
          >
            JSON
          </button>
          <button
            onClick={exportCSV}
            className="btn-secondary py-4 text-sm font-display font-700 tracking-wider"
          >
            CSV
          </button>
        </div>
        <p className="text-gray-700 text-xs mt-3 text-center font-body">
          Toutes les séances terminées sont incluses dans l'export.
        </p>
      </div>

      {/* Zone de danger */}
      <div className="card p-4 border-red-900/40">
        <p className="font-display font-600 text-[11px] tracking-widest text-red-800 uppercase mb-3">
          Zone de danger
        </p>
        <button
          onClick={clearAll}
          className="w-full bg-red-950/50 border border-red-900/60 text-red-600 py-3.5 rounded-xl
                     font-display font-700 text-sm tracking-wide active:scale-95 transition-transform"
        >
          EFFACER TOUTES LES DONNÉES
        </button>
      </div>

      {/* Footer */}
      <p className="text-gray-800 text-xs text-center pb-4 font-mono">
        WorkoutPro v1.0 · Données stockées localement sur cet appareil
      </p>
    </div>
  )
}

// ============================================================
//  COMPOSANT RACINE : App
// ============================================================
export default function App() {
  // Chargement initial depuis localStorage
  const [data, setData] = useState({ sessions: [], customExercises: [] })
  useEffect(() => {
    loadFromStorage().then(d => setData(d))
  }, [])
  const [activeTab, setActiveTab] = useState('session')
  const timer = useRestTimer()

  // Indicateur de séance active (pour l'icône de l'onglet)
  const hasActive = useMemo(() => data.sessions.some(s => s.isActive), [data.sessions])

  // Définition des onglets de navigation
  const TABS = [
    { id: 'session',  label: 'SÉANCE',      icon: hasActive ? '🔥' : '💪' },
    { id: 'history',  label: 'HISTORIQUE',  icon: '📋' },
    { id: 'progress', label: 'PROGRESSION', icon: '📈' },
    { id: 'settings', label: 'RÉGLAGES',    icon: '⚙️' },
  ]

  return (
    <div className="bg-[#0D0D0F] h-screen flex flex-col max-w-lg mx-auto overflow-hidden">

      {/* Zone de contenu principal */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'session'  && <SessionView  data={data} setData={setData} timer={timer} />}
        {activeTab === 'history'  && <HistoryView  data={data} setData={setData} />}
        {activeTab === 'progress' && <ProgressView data={data} />}
        {activeTab === 'settings' && <SettingsView data={data} setData={setData} timer={timer} />}
      </main>

      {/* Barre de navigation (onglets) */}
      <nav className="h-[68px] bg-[#0D0D0F] border-t border-[#2A2A32] flex items-stretch shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors
                        ${activeTab === tab.id ? 'text-[#6366F1]' : 'text-[#3B3B45]'}`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className={`font-display font-600 text-[9px] tracking-widest leading-none
                              ${activeTab === tab.id ? 'text-[#6366F1]' : 'text-[#3B3B45]'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}
