import React, { useEffect, useMemo, useState } from 'react';
import styles from './App.module.css';
import { fetchRandomGen1, fetchPokemon, type Pokemon } from '@/utils/pokeapi';
import { store } from '@/utils/store';
import { notifyCatch, notifyShiny } from '@/utils/notifications';

type AttemptState = { attemptsLeft: number; lastResult?: 'success' | 'fail' };

const TYPE_FR_TO_EN: Record<string, string> = {
  'Normal': 'normal', 'Feu': 'fire', 'Eau': 'water', 'Plante': 'grass', 
  'Électrik': 'electric', 'Glace': 'ice', 'Combat': 'fighting', 'Poison': 'poison',
  'Sol': 'ground', 'Vol': 'flying', 'Psy': 'psychic', 'Insecte': 'bug',
  'Roche': 'rock', 'Spectre': 'ghost', 'Dragon': 'dragon', 'Ténèbres': 'dark',
  'Acier': 'steel', 'Fée': 'fairy'
};

function TypeTag({ type }: { type: string }) {
  const englishType = TYPE_FR_TO_EN[type] || type.toLowerCase();
  const colorVar = `var(--pokecatch-color-${englishType})`;
  return <span className={styles.tag} style={{ background: colorVar }}>{type}</span>;
}

export default function App() {
  type Page = 'encounter' | 'team' | 'pokedex' | 'favorites';
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [theme, setTheme] = useState(store.getTheme());
  const [page, setPage] = useState<Page>('encounter');
  const [current, setCurrent] = useState<Pokemon | null>(null);
  const [attempt, setAttempt] = useState<AttemptState>({ attemptsLeft: 3 });
  const [ballPhase, setBallPhase] = useState<'mounting' | 'catching' | null>(null);
  const [catchResult, setCatchResult] = useState<'success' | 'fail' | null>(null);
  const [team, setTeam] = useState<Pokemon[]>(store.getTeam());
  const [pokedex, setPokedex] = useState<Pokemon[]>(store.getPokedex());
  const [encounters, setEncounters] = useState<Pokemon[]>(store.getEncounters());
  const [favorites, setFavorites] = useState<Record<number, boolean>>(store.getFavorites());
  const [showManageModal, setShowManageModal] = useState(false);
  const [stats, setStats] = useState(store.getStats());
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    store.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (navigator.onLine) {
      nextEncounter();
    } else {
      setCurrent(null);
      setPage('pokedex');
    }
  }, []);

  async function nextEncounter() {
    if (!navigator.onLine) {
      setCurrent(null);
      setAttempt({ attemptsLeft: 3 });
      return;
    }

    try {
      const p = await fetchRandomGen1();
      setCurrent(p);
      setAttempt({ attemptsLeft: 3 });
      setStats((s: ReturnType<typeof store.getStats>) => store.setStats({ ...s, encounters: s.encounters + 1 }));
      setEncounters(prev => store.upsertEncounter(prev, p));
      if (p.shiny) notifyShiny(p);
      if (p.cry && audioRef.current) {
        audioRef.current.src = p.cry;
        audioRef.current.play().catch(() => {});
      }
    } catch (err) {
      const pool = [...pokedex, ...encounters].filter((p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx);
      if (pool.length === 0) {
        setCurrent(null);
        return;
      }
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setCurrent(pick);
      setAttempt({ attemptsLeft: 3 });
      setStats((s: ReturnType<typeof store.getStats>) => store.setStats({ ...s, encounters: s.encounters + 1 }));
    }
  }

  function tryCapture() {
    if (!current) return;
    if (attempt.attemptsLeft <= 0) return;
    const successChance = current.catchRate / 255;
    const success = Math.random() < successChance;
    const left = attempt.attemptsLeft - 1;
    
    setBallPhase('mounting');
    setTimeout(() => {
      setCatchResult(success ? 'success' : 'fail');
      setBallPhase('catching');
      setAttempt({ attemptsLeft: left, lastResult: success ? 'success' : 'fail' });
      
      if (success) {
        const newTeam = [...team, current];
        const newPokedex = store.upsertPokedex([...pokedex], current);
        setPokedex(newPokedex);
        setStats((s: ReturnType<typeof store.getStats>) => store.setStats({ ...s, captures: s.captures + 1 }));
        notifyCatch(current);
        setTimeout(() => {
          setBallPhase(null);
          setCatchResult(null);
          if (newTeam.length > 6) {
            setShowManageModal(true);
          } else {
            setTeam(store.setTeam(newTeam));
            nextEncounter();
          }
        }, 700);
      } else if (left === 0) {
        setTimeout(() => {
          setBallPhase(null);
          setCatchResult(null);
          nextEncounter();
        }, 1300);
      } else {
        setTimeout(() => {
          setBallPhase(null);
          setCatchResult(null);
        }, 1300);
      }
    }, 700);
  }

  function flee() {
    if (navigator.onLine) nextEncounter();
  }

  function toggleFavorite(id: number) {
    const next = { ...favorites, [id]: !favorites[id] };
    setFavorites(store.setFavorites(next));
  }

  function replaceTeam(indexToRemove: number) {
    if (!current) return;
    const nextTeam = team.filter((_, i) => i !== indexToRemove);
    const finalTeam = store.setTeam([...nextTeam, current]);
    setTeam(finalTeam);
    setShowManageModal(false);
    nextEncounter();
  }

  async function openDetail(pokemon: Pokemon) {
    if (!pokemon.stats || !pokemon.abilities) {
      const freshData = await fetchPokemon(pokemon.id);
      setSelectedPokemon(freshData);
    } else {
      setSelectedPokemon(pokemon);
    }
    setShowDetailModal(true);
  }

  function closeDetail() {
    setShowDetailModal(false);
    setSelectedPokemon(null);
  }

  function playCry() {
    if (selectedPokemon?.cry && audioRef.current) {
      audioRef.current.src = selectedPokemon.cry;
      audioRef.current.play();
    }
  }

  const typeTags = useMemo<string[]>(() => current?.types ?? [], [current]);
  const favoriteList = useMemo(() => pokedex.filter(p => favorites[p.id]), [pokedex, favorites]);

  return (
    <>
      <audio ref={audioRef} />
      <div className="container">
        <div className={styles.app}>
        <header className={styles.header}>
          <h1 className={styles.title}>PokeCatch</h1>
          <div className={styles.actions}>
            <button className={`${styles.button} ${'ghost'}`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Mode {theme === 'dark' ? 'Clair' : 'Sombre'}</button>
            <button className={styles.button} onClick={nextEncounter}>Nouveau Pokémon</button>
          </div>
        </header>
        <nav className={styles.tabs}>
          <button className={`${styles.tab} ${page==='encounter'?styles.tabActive:''}`} onClick={()=>setPage('encounter')}>Rencontre</button>
          <button className={`${styles.tab} ${page==='team'?styles.tabActive:''}`} onClick={()=>setPage('team')}>Équipe</button>
          <button className={`${styles.tab} ${page==='pokedex'?styles.tabActive:''}`} onClick={()=>setPage('pokedex')}>Pokédex</button>
          <button className={`${styles.tab} ${page==='favorites'?styles.tabActive:''}`} onClick={()=>setPage('favorites')}>Favoris</button>
        </nav>

        {page==='encounter' && (
        <section className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.flex}>
              <div style={{ position: 'relative', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {current && (
                  <>
                    <img alt={current.name} src={current.image} width={220} height={220} style={{ imageRendering: 'pixelated', visibility: ballPhase ? 'hidden' : 'visible' }} />
                    {pokedex.find(p => p.id === current.id) && <img src="/assets/pokeball-sprite.png" alt="Captured" style={{ position: 'absolute', top: 0, right: 0, width: '48px', height: '48px', visibility: ballPhase ? 'hidden' : 'visible' }} />}
                    {current.shiny && <img src="/assets/star.png" alt="Shiny" style={{ position: 'absolute', top: 0, left: 0, width: '48px', height: '48px', visibility: ballPhase ? 'hidden' : 'visible' }} />}
                  </>
                )}
                {ballPhase && (
                  <div className={`${styles.pokeball} ${ballPhase === 'mounting' ? styles.mount : `${styles.catch} ${catchResult === 'success' ? styles.success : styles.fail}`}`} aria-hidden="true" />
                )}
                {ballPhase === 'catching' && catchResult === 'success' && (
                  <>
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className={styles.stars} style={{ '--tx': `${Math.cos(i * (Math.PI / 4)) * 100}px`, '--ty': `${Math.sin(i * (Math.PI / 4)) * 100}px` } as React.CSSProperties}>✨</div>
                    ))}
                  </>
                )}
              </div>
              <div>
                <h2 style={{ margin: 0, textTransform: 'capitalize' }}>{current?.name}</h2>
                <div className={styles.types}>
                  {typeTags.map(t => <TypeTag key={t} type={t} />)}
                </div>
                <div className={styles.flex}>
                  <button className={styles.button} onClick={tryCapture} disabled={!current || attempt.attemptsLeft<=0}>Lancer la Pokéball ({attempt.attemptsLeft})</button>
                  <button className={`${styles.button} secondary`} onClick={flee}>Fuir</button>
                  {current && <button className={`${styles.button} ghost`} onClick={() => toggleFavorite(current.id)}>{favorites[current.id] ? '★ Favori' : '☆ Favori'}</button>}
                </div>
              </div>
            </div>
          </div>
          <aside className={styles.card}>
            <h3>Statistiques</h3>
            <div>Capturés: {stats.captures} / Rencontres: {stats.encounters}</div>
            <h3>Équipe ({team.length}/6)</h3>
            <div className={styles.list}>
              {team.map((p, i) => (
                <div key={p.id} className={styles.item}>
                  <img 
                    alt={p.name} 
                    src={p.image} 
                    width={72} 
                    height={72} 
                    style={{ imageRendering: 'pixelated', cursor: 'pointer' }}
                    onClick={() => openDetail(p)}
                  />
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{ textTransform: 'capitalize' }}>{p.name}</span>
                    <button className={`${styles.button} ghost`} onClick={() => setTeam(store.setTeam(team.filter((_, idx) => idx !== i)))}>Libérer</button>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
        )}

        {page==='pokedex' && (
        <section className={styles.card}>
          <h3>Pokédex ({pokedex.length}/151)</h3>
          <div className={styles.pokedexGrid}>
            {Array.from({ length: 151 }, (_, i) => i + 1).map(id => {
              const captured = pokedex.find(p => p.id === id);
              const encountered = encounters.find(p => p.id === id);
              const mon = captured || encountered;
              
              if (!mon) {
                return (
                  <div key={id} className={styles.card} style={{ textAlign: 'center', padding: '8px' }}>
                    <div style={{ fontSize: '32px', opacity: 0.3 }}>?</div>
                    <div style={{ fontSize: '10px', opacity: 0.5 }}>#{id.toString().padStart(3, '0')}</div>
                  </div>
                );
              }
              
              return (
                <div 
                  key={id} 
                  className={styles.card} 
                  style={{ textAlign: 'center', padding: '8px', position: 'relative', cursor: captured ? 'pointer' : 'default' }}
                  onClick={() => captured && openDetail(captured)}
                >
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img alt={mon.name} src={mon.image} width={64} height={64} style={{ imageRendering: 'pixelated', filter: captured ? 'none' : 'brightness(0) blur(3px) contrast(200%)' }} />
                    {captured && <img src="/assets/pokeball-sprite.png" alt="Captured" style={{ position: 'absolute', top: -4, right: -4, width: '20px', height: '20px' }} />}
                    {mon.shiny && captured && <img src="/assets/star.png" alt="Shiny" style={{ position: 'absolute', top: -4, left: -4, width: '16px', height: '16px' }} />}
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.7 }}>#{id.toString().padStart(3, '0')}</div>
                  <div style={{ fontSize: '11px', textTransform: 'capitalize', fontWeight: captured ? 'bold' : 'normal', opacity: captured ? 1 : 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mon.name}</div>
                  {captured && <button className={`${styles.button} ghost`} onClick={() => toggleFavorite(id)} style={{ marginTop: '4px', padding: '4px 8px', fontSize: '12px' }}>{favorites[id] ? '★' : '☆'}</button>}
                </div>
              );
            })}
          </div>
        </section>
        )}

        {page==='team' && (
        <section className={styles.card}>
          <h3>Équipe ({team.length}/6)</h3>
          <div className={styles.list}>
            {team.length === 0 && <div>Aucun Pokémon dans l'équipe pour le moment.</div>}
            {team.map((p, i) => (
              <div key={p.id} className={styles.item}>
                <div className={styles.itemInner}>
                  <img className={styles.sprite} alt={p.name} src={p.image} width={80} height={80} style={{ imageRendering: 'pixelated', cursor: 'pointer' }} onClick={() => openDetail(p)} />
                  <div className={styles.row}>
                    <span className={styles.name}>{p.name}</span>
                    <div className={styles.actions}>
                      <button className={`${styles.button} ghost`} onClick={() => setTeam(store.setTeam(team.filter((_, idx) => idx !== i)))}>Libérer</button>
                      <button className={`${styles.button} ghost`} onClick={() => toggleFavorite(p.id)}>{favorites[p.id] ? '★' : '☆'}</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {page==='favorites' && (
        <section className={styles.card}>
          <h3>Favoris</h3>
          <div className={styles.list}>
            {favoriteList.length === 0 && <div>Aucun favori pour l'instant. Marquez vos préférés avec ☆.</div>}
            {favoriteList.map(p => (
              <div key={p.id} className={styles.item}>
                <img alt={p.name} src={p.image} width={72} height={72} style={{ imageRendering: 'pixelated', cursor: 'pointer' }} onClick={() => openDetail(p)} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{ textTransform: 'capitalize' }}>{p.name}</span>
                  <button className={`${styles.button} ghost`} onClick={() => toggleFavorite(p.id)}>Retirer ★</button>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {showManageModal && (
          <div className={styles.modal} role="dialog" aria-modal>
            <div className={styles.modalContent}>
              <h3>Équipe pleine — Remplacer un Pokémon</h3>
              <p>Choisissez un membre à libérer pour ajouter {current?.name}.</p>
              <div className={styles.list}>
                {team.map((p, i) => (
                  <button key={p.id} className={`${styles.button} ghost`} onClick={() => replaceTeam(i)}>
                    <img alt={p.name} src={p.image} width={48} height={48} style={{ imageRendering: 'pixelated' }} />
                    <span style={{ marginLeft: 8, textTransform:'capitalize' }}>{p.name}</span>
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
                <button className={`${styles.button} ghost`} onClick={() => { setShowManageModal(false); nextEncounter(); }}>Annuler</button>
              </div>
            </div>
          </div>
        )}

        {showDetailModal && selectedPokemon && (
          <div className={styles.modal} role="dialog" aria-modal onClick={closeDetail}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ textTransform: 'capitalize', margin: 0 }}>
                  {selectedPokemon.name}
                  {selectedPokemon.shiny && <span style={{ marginLeft: 8 }}>✨</span>}
                </h2>
                <button className={`${styles.button} ghost`} onClick={closeDetail}>✕</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <img 
                    alt={selectedPokemon.name} 
                    src={selectedPokemon.image} 
                    width={180} 
                    height={180} 
                    style={{ imageRendering: 'pixelated' }} 
                  />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {selectedPokemon.types.map((type: string) => (
                      <TypeTag key={type} type={type} />
                    ))}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>
                    #{selectedPokemon.id.toString().padStart(3, '0')}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <strong>Taille:</strong> {selectedPokemon.height / 10}m
                  </div>
                  <div>
                    <strong>Poids:</strong> {selectedPokemon.weight / 10}kg
                  </div>
                </div>

                {selectedPokemon.abilities && selectedPokemon.abilities.length > 0 && (
                  <div>
                    <h3 style={{ marginBottom: '8px' }}>Capacités</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedPokemon.abilities.map((ability: string) => (
                        <span 
                          key={ability} 
                          className={styles.tag}
                          style={{ background: 'var(--pokecatch-color-primary)', textTransform: 'capitalize' }}
                        >
                          {ability}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPokemon.stats && selectedPokemon.stats.length > 0 && (
                  <div>
                    <h3 style={{ marginBottom: '8px' }}>Statistiques</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedPokemon.stats.map((s: { base_stat: number; stat: { name: string } }) => {
                      const statName = s.stat.name === 'hp' ? 'PV' :
                        s.stat.name === 'attack' ? 'Attaque' :
                        s.stat.name === 'defense' ? 'Défense' :
                        s.stat.name === 'special-attack' ? 'Att. Spé.' :
                        s.stat.name === 'special-defense' ? 'Déf. Spé.' :
                        s.stat.name === 'speed' ? 'Vitesse' : s.stat.name;
                      const percentage = (s.base_stat / 255) * 100;
                      
                      return (
                        <div key={s.stat.name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                            <span>{statName}</span>
                            <span style={{ fontWeight: 'bold' }}>{s.base_stat}</span>
                          </div>
                          <div style={{ 
                            width: '100%', 
                            height: '8px', 
                            background: 'var(--pokecatch-color-bg)', 
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              width: `${percentage}%`, 
                              height: '100%', 
                              background: 'var(--pokecatch-color-primary)',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button 
                    className={styles.button} 
                    onClick={playCry}
                    disabled={!selectedPokemon.cry}
                  >
                    🔊 Écouter le cri
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
