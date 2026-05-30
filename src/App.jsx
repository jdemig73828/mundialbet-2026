import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, LogIn, CheckCircle, AlertCircle, Euro, ChevronRight, BarChart2, ShieldAlert, Loader2 } from 'lucide-react';
import { supabase } from './supabaseClient';

// ============================================================================
// ⚠️ CONFIGURACIÓN DE BASE DE DATOS
// ============================================================================
// Para el entorno de vista previa, usamos un Mock (Simulador).
// CUANDO COPIES ESTO A TU ORDENADOR (Vercel), cambia 'isMock' a false y descomenta las importaciones.

const isMock = false; // <-- CAMBIA A FALSE EN TU ORDENADOR





// --- MOCK FALSO (Solo funciona si isMock = true) ---
export const supabase = isMock ? {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async () => { alert("Vista Previa: Simulando registro..."); return { error: null }; },
    signInWithPassword: async () => { alert("Vista Previa: Simulando login..."); return { error: null }; },
    signOut: async () => {}
  },
  from: () => ({
    select: () => ({ 
      eq: () => ({ single: async () => ({ data: null, error: null }) }),
      order: async () => ({ data: [], error: null }) 
    }),
    upsert: async () => ({ error: null }),
    insert: async () => ({ error: null })
  })
} : null; // Si isMock es false, usará el cliente real de arriba.
// ============================================================================

const TEAMS = [
  { id: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  { id: 'BRA', name: 'Brasil', flag: '🇧🇷' },
  { id: 'CAN', name: 'Canadá', flag: '🇨🇦' },
  { id: 'COL', name: 'Colombia', flag: '🇨🇴' },
  { id: 'CRO', name: 'Croacia', flag: '🇭🇷' },
  { id: 'ENG', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'ESP', name: 'España', flag: '🇪🇸' },
  { id: 'FRA', name: 'Francia', flag: '🇫🇷' },
  { id: 'GER', name: 'Alemania', flag: '🇩🇪' },
  { id: 'JPN', name: 'Japón', flag: '🇯🇵' },
  { id: 'MAR', name: 'Marruecos', flag: '🇲🇦' },
  { id: 'MEX', name: 'México', flag: '🇲🇽' },
  { id: 'NED', name: 'Países Bajos', flag: '🇳🇱' },
  { id: 'POR', name: 'Portugal', flag: '🇵🇹' },
  { id: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  { id: 'URU', name: 'Uruguay', flag: '🇺🇾' },
  { id: 'USA', name: 'Estados Unidos', flag: '🇺🇸' }
].sort((a, b) => a.name.localeCompare(b.name));

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('home');
  
  const [profile, setProfile] = useState({ name: '', phone: '', hasPaid: false, points: 0 });
  const [userPicks, setUserPicks] = useState({ first: '', second: '', third: '', fourth: '' });
  const [isLocked, setIsLocked] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (isMock) {
        setLoading(false);
        return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserData(session.user.id);
        setCurrentTab('dashboard');
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserData(session.user.id);
        setCurrentTab('dashboard');
      } else {
        setProfile({ name: '', phone: '', hasPaid: false, points: 0 });
        setUserPicks({ first: '', second: '', third: '', fourth: '' });
        setIsLocked(false);
        setCurrentTab('home');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileData) {
        setProfile({
          name: profileData.name || '',
          phone: profileData.phone || '',
          hasPaid: profileData.has_paid,
          points: profileData.points
        });
      }

      const { data: picksData } = await supabase
        .from('picks')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (picksData) {
        setUserPicks({
          first: picksData.first_place,
          second: picksData.second_place,
          third: picksData.third_place,
          fourth: picksData.fourth_place
        });
        setIsLocked(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    if (isMock) return; 
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, name, points, has_paid,
          picks (first_place, second_place, third_place, fourth_place)
        `)
        .order('points', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const formattedData = data.map(user => ({
          id: user.id,
          name: user.name || 'Usuario Anónimo',
          points: user.points,
          hasPaid: user.has_paid,
          picks: user.picks && user.picks.length > 0 ? {
            first: user.picks[0].first_place,
            second: user.picks[0].second_place,
            third: user.picks[0].third_place,
            fourth: user.picks[0].fourth_place
          } : null
        })).filter(u => u.picks !== null);

        setLeaderboard(formattedData);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (isMock) {
        setAuthError("Estás en modo Vista Previa. Las funciones de base de datos están desactivadas para evitar errores.");
        return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Revisa tu correo para verificar la cuenta o inicia sesión directamente.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!isMock) {
        await supabase.auth.signOut();
    }
  };

  const updatePick = (position, teamId) => {
    if (isLocked) return;
    setUserPicks({ ...userPicks, [position]: teamId });
  };

  const isPicksValid = () => {
    const picksArray = Object.values(userPicks);
    const hasEmpty = picksArray.some(p => p === '');
    const uniqueTeams = new Set(picksArray.filter(p => p !== ''));
    return !hasEmpty && uniqueTeams.size === 4;
  };

  const saveToDatabase = async () => {
    if (!session || !isPicksValid() || !profile.name || !profile.phone) return;

    if(!window.confirm("¿Estás seguro? Una vez guardados en la base de datos, no podrás cambiar tus datos ni tus favoritos.")) {
      return;
    }

    if (isMock) {
        alert("Modo prueba: No se guardó nada en la BD.");
        return;
    }

    setLoading(true);
    try {
      const userId = session.user.id;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId, name: profile.name, phone: profile.phone }, { onConflict: 'id' });
      
      if (profileError) throw profileError;

      const { error: picksError } = await supabase
        .from('picks')
        .insert({
          user_id: userId,
          first_place: userPicks.first,
          second_place: userPicks.second,
          third_place: userPicks.third,
          fourth_place: userPicks.fourth
        });
      
      if (picksError) throw picksError;

      setIsLocked(true);
      alert("¡Apuesta guardada con éxito!");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Hubo un error al guardar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const Navbar = () => (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentTab(session ? 'dashboard' : 'home')}>
            <Trophy className="h-8 w-8 text-lime-400" />
            <span className="text-white font-bold text-xl tracking-wider">MUNDIAL<span className="text-lime-400">BET</span> 2026</span>
          </div>
          <div className="flex items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-slate-300 hidden sm:inline-block">Hola, <span className="font-semibold text-white">{profile.name || session.user.email.split('@')[0]}</span></span>
                <button 
                  onClick={handleLogout}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setCurrentTab('login')}
                className="bg-lime-500 hover:bg-lime-600 text-slate-900 px-4 py-2 rounded-md text-sm font-bold flex items-center transition-colors shadow-lg shadow-lime-500/20"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Entrar / Registro
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  const LandingPage = () => (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div 
        className="relative bg-slate-900 py-32 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center overflow-hidden bg-cover bg-center" 
        style={{ backgroundImage: "linear-gradient(to bottom, rgba(2, 6, 23, 0.7), rgba(2, 6, 23, 1)), url('https://images.unsplash.com/photo-1522778119026-d647f0596c20?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
      >
        <Trophy className="h-24 w-24 text-lime-400 mb-6 z-10 drop-shadow-[0_0_25px_rgba(132,204,22,0.8)]" />
        <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight z-10 mb-6 drop-shadow-lg">
          La Gran Porra del <span className="text-lime-400">Mundial 2026</span>
        </h1>
        <p className="max-w-2xl text-xl text-slate-200 z-10 mb-10 font-medium drop-shadow-md">
          Demuestra quién sabe más de fútbol en el barrio. Elige tus 4 favoritos y su posición exacta, sigue los resultados en directo y llévate el gran bote.
        </p>
        <button 
          onClick={() => setCurrentTab('login')}
          className="z-10 bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold text-xl px-10 py-5 rounded-full shadow-[0_0_30px_rgba(132,204,22,0.5)] transition-all transform hover:scale-105"
        >
          ¡Participar Ahora!
        </button>
      </div>

      <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white text-center mb-12">¿Cómo funciona?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg hover:border-slate-700 transition-colors">
            <div className="bg-lime-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-lime-400 h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">1. Elige 4 Favoritos</h3>
            <p className="text-slate-400 text-sm">
              Regístrate y selecciona a las 4 selecciones (Campeón, Subcampeón, 3º y 4º). Piensa bien, una vez guardados <strong>no se pueden cambiar</strong>.
            </p>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg hover:border-slate-700 transition-colors">
            <div className="bg-blue-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Euro className="text-blue-400 h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">2. Cuota de 20€ (Bizum)</h3>
            <p className="text-slate-400 text-sm">
              Para validar tu apuesta debes realizar un Bizum de 20€ al administrador poniendo tu nombre de usuario en el concepto.
            </p>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg hover:border-slate-700 transition-colors">
            <div className="bg-purple-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Trophy className="text-purple-400 h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">3. El Gran Bote</h3>
            <p className="text-slate-400 text-sm">
              Todo lo recaudado se reparte entre los 3 mejores al final del torneo. Cuantos más seamos, ¡mayor será el premio!
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const LoginPage = () => (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-950">
      <div className="bg-slate-900 max-w-md w-full rounded-2xl shadow-2xl p-8 border border-slate-800">
        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 text-lime-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white">{isRegistering ? 'Crear Cuenta' : 'Acceso Jugadores'}</h2>
          <p className="text-slate-400 mt-2 text-sm">
            {isRegistering ? 'Regístrate para hacer tu apuesta.' : 'Inicia sesión para ver tus resultados.'}
          </p>
        </div>
        
        {authError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-xs text-red-400">{authError}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button 
            type="submit"
            disabled={authLoading}
            className="w-full bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center disabled:opacity-50"
          >
            {authLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (isRegistering ? 'Registrarme' : 'Entrar')} 
            {!authLoading && <ChevronRight className="ml-2 h-5 w-5" />}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800 pt-6">
          <button 
            type="button" 
            onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate gratis'}
          </button>
        </div>
      </div>
    </div>
  );

  const Dashboard = () => {
    const [activeView, setActiveView] = useState('picks');

    useEffect(() => {
      if (activeView === 'leaderboard') {
        fetchLeaderboard();
      }
    }, [activeView]);

    if (loading) {
      return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin h-10 w-10 text-lime-500" /></div>;
    }

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          
          {session && !profile.hasPaid && isLocked && (
            <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4 mb-6 flex items-start sm:items-center">
              <AlertCircle className="text-orange-500 h-5 w-5 mt-0.5 sm:mt-0 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-orange-400 text-sm font-medium">Estado del pago: Pendiente</p>
                <p className="text-slate-400 text-xs mt-1">Has guardado tu apuesta, pero recuerda realizar el Bizum de 20€ al administrador para validarla.</p>
              </div>
            </div>
          )}

          <div className="flex overflow-x-auto bg-slate-900 border-b border-slate-800 mb-6 p-2 space-x-2 hide-scrollbar">
            <button onClick={() => setActiveView('picks')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeView === 'picks' ? 'bg-lime-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <CheckCircle className="w-4 h-4 mr-2" /> Mis Favoritos
            </button>
            <button onClick={() => setActiveView('leaderboard')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeView === 'leaderboard' ? 'bg-lime-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Users className="w-4 h-4 mr-2" /> Clasificación Global
            </button>
          </div>

          {activeView === 'picks' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="text-xl font-bold text-white mb-4">1. Tus Datos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nombre / Apodo</label>
                    <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} disabled={isLocked} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50" placeholder="Ej: Vecino_77"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Teléfono (Para Bizum)</label>
                    <input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} disabled={isLocked} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50" placeholder="Ej: 600 123 456"/>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="text-xl font-bold text-white mb-2">2. Selecciona tus 4 Favoritos</h3>
                <p className="text-slate-400 text-sm mb-6">
                  {isLocked ? "Tus selecciones están guardadas en la base de datos. ¡Suerte!" : "Elige Campeón, Subcampeón, 3º y 4º."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { id: 'first', label: '1º Campeón', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
                    { id: 'second', label: '2º Subcampeón', color: 'text-slate-300', bg: 'bg-slate-300/10' },
                    { id: 'third', label: '3º Tercer Puesto', color: 'text-orange-400', bg: 'bg-orange-400/10' },
                    { id: 'fourth', label: '4º Cuarto Puesto', color: 'text-slate-500', bg: 'bg-slate-500/10' }
                  ].map(pos => (
                    <div key={pos.id} className={`p-4 rounded-xl border border-slate-700 ${pos.bg}`}>
                      <label className={`block font-bold mb-2 ${pos.color}`}>{pos.label}</label>
                      <select 
                        value={userPicks[pos.id]}
                        onChange={(e) => updatePick(pos.id, e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">-- Selecciona un equipo --</option>
                        {TEAMS.map(team => {
                          const isSelectedElsewhere = Object.entries(userPicks).some(([key, val]) => key !== pos.id && val === team.id);
                          return (
                            <option key={team.id} value={team.id} disabled={isSelectedElsewhere}>
                              {team.flag} {team.name}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ))}
                </div>

                {!isLocked && (
                  <div className="mt-8 flex flex-col items-end">
                    <button
                      onClick={saveToDatabase}
                      disabled={!isPicksValid() || !profile.name || !profile.phone}
                      className={`px-6 py-3 rounded-lg font-bold transition-all
                        ${(isPicksValid() && profile.name && profile.phone)
                          ? 'bg-lime-500 text-slate-900 hover:bg-lime-400 shadow-[0_0_15px_rgba(132,204,22,0.4)]' 
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                      `}
                    >
                      Confirmar y Guardar Apuesta
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'leaderboard' && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Clasificación General</h3>
                </div>
                <BarChart2 className="h-6 w-6 text-slate-500" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="text-xs uppercase bg-slate-950/50 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Pos</th>
                      <th className="px-6 py-4 font-medium">Usuario</th>
                      <th className="px-6 py-4 font-medium">Selecciones (1º al 4º)</th>
                      <th className="px-6 py-4 font-medium text-center">Puntos</th>
                      <th className="px-6 py-4 font-medium text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-8 text-slate-500">Aún no hay apuestas registradas.</td></tr>
                    ) : (
                      leaderboard.map((p, idx) => (
                        <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-white">{idx + 1}</td>
                          <td className="px-6 py-4 font-medium text-slate-200">{p.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              {['first', 'second', 'third', 'fourth'].map((pos) => {
                                const team = TEAMS.find(t => t.id === p.picks[pos]);
                                return (
                                  <span key={pos} title={team?.name} className={`text-lg bg-slate-950 px-2 py-0.5 rounded border border-slate-700`}>
                                    {team?.flag || '❓'}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-lime-400">{p.points}</td>
                          <td className="px-6 py-4 text-center">
                            {p.hasPaid ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400">Pagado</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400">Impago</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  return (
    <div className="font-sans bg-slate-950 min-h-screen">
      <Navbar />
      {currentTab === 'home' && <LandingPage />}
      {currentTab === 'login' && <LoginPage />}
      {currentTab === 'dashboard' && <Dashboard />}
    </div>
  );
}